import cron from 'node-cron';
import { WindowService } from './windowService';
import { logger } from '../utils/logger';

/**
 * Scheduler service to handle automatic cleanup tasks
 */
export class SchedulerService {
  private static isInitialized = false;

  /**
   * Initialize all scheduled tasks
   */
  static initialize() {
    if (this.isInitialized) {
      logger.warn('SchedulerService already initialized');
      return;
    }

    logger.info('Initializing SchedulerService...');

    // Schedule window cleanup every hour
    this.scheduleWindowCleanup();

    // Schedule window status updates every 5 minutes
    this.scheduleWindowStatusUpdates();

    this.isInitialized = true;
    logger.info('SchedulerService initialized successfully');
  }

  /**
   * Schedule automatic cleanup of ended windows
   * Runs every hour at minute 0
   */
  private static scheduleWindowCleanup() {
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Running scheduled window cleanup...');
        const result = await WindowService.deleteEndedWindows();
        
        if (result.deleted > 0) {
          logger.info(`Scheduled cleanup: Deleted ${result.deleted} ended windows`);
        } else {
          logger.debug('Scheduled cleanup: No ended windows to delete');
        }
      } catch (error) {
        logger.error('Error in scheduled window cleanup:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // Use UTC to match database timestamps
    });

    logger.info('Scheduled window cleanup task: Every hour at minute 0');
  }

  /**
   * Schedule automatic window status updates
   * Runs every 5 minutes
   */
  private static scheduleWindowStatusUpdates() {
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.debug('Running scheduled window status update...');
        const result = await WindowService.updateWindowStatuses();
        
        if (result.updated > 0) {
          logger.info(`Scheduled update: Updated ${result.updated} window statuses`);
        }
      } catch (error) {
        logger.error('Error in scheduled window status update:', error);
      }
    }, {
      scheduled: true,
      timezone: 'UTC' // Use UTC to match database timestamps
    });

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
    cron.getTasks().forEach((task) => {
      task.stop();
    });
    
    this.isInitialized = false;
    logger.info('SchedulerService shut down successfully');
  }

  /**
   * Get status of all scheduled tasks
   */
  static getStatus() {
    const tasks = cron.getTasks();
    return {
      initialized: this.isInitialized,
      taskCount: tasks.size,
      tasks: Array.from(tasks.entries()).map(([name, task]) => ({
        name,
        running: task.running
      }))
    };
  }
}