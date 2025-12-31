const cron = require('node-cron');
import { WindowService } from './windowService';
import { logger } from '../utils/logger';

/**
 * Scheduler service to handle automatic cleanup tasks
 */
export class SchedulerService {
  private static isInitialized = false;
  private static tasks: any[] = [];

  /**
   * Initialize all scheduled tasks
   */
  static initialize() {
    if (this.isInitialized) {
      logger.warn('SchedulerService already initialized');
      return;
    }

    logger.info('Initializing SchedulerService...');

    // Only schedule window status updates (no deletion)
    this.scheduleWindowStatusUpdates();

    this.isInitialized = true;
    logger.info('SchedulerService initialized successfully');
  }



  /**
   * Schedule automatic window status updates
   * Runs every 5 minutes
   */
  private static scheduleWindowStatusUpdates() {
    const task = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.debug('Running scheduled window status update...');
        const result = await WindowService.updateWindowStatuses();
        
        if (result.updated > 0) {
          logger.info(`Scheduled update: Updated ${result.updated} window statuses`);
        }
      } catch (error) {
        logger.error('Error in scheduled window status update:', error);
      }
    });

    this.tasks.push(task);
    logger.info('Scheduled window status updates: Every 5 minutes');
  }

  /**
   * Stop all scheduled tasks (for graceful shutdown)
   */
  static shutdown() {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Shutting down SchedulerService...');
    
    // Stop all tasks
    this.tasks.forEach((task) => {
      if (task && typeof task.destroy === 'function') {
        task.destroy();
      }
    });
    
    this.tasks = [];
    this.isInitialized = false;
    logger.info('SchedulerService shut down successfully');
  }

  /**
   * Get status of all scheduled tasks
   */
  static getStatus() {
    return {
      initialized: this.isInitialized,
      taskCount: this.tasks.length,
      tasks: this.tasks.map((_, index) => ({
        id: index,
        name: index === 0 ? 'window-cleanup' : 'status-updates',
        status: 'active'
      }))
    };
  }
}