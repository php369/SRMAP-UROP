import { WindowService } from './windowService';
import { logger } from '../utils/logger';

/**
 * Simple scheduler service using setTimeout/setInterval
 * Fallback implementation without external dependencies
 */
export class SimpleSchedulerService {
  private static isInitialized = false;
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * Initialize all scheduled tasks
   */
  static initialize() {
    if (this.isInitialized) {
      logger.warn('SimpleSchedulerService already initialized');
      return;
    }

    logger.info('Initializing SimpleSchedulerService...');

    // Only schedule window status updates (no deletion)
    this.scheduleWindowStatusUpdates();

    this.isInitialized = true;
    logger.info('SimpleSchedulerService initialized successfully');
  }



  /**
   * Schedule automatic window status updates
   * Runs every 5 minutes
   */
  private static scheduleWindowStatusUpdates() {
    const interval = setInterval(async () => {
      try {
        logger.debug('Running scheduled window status update...');
        const result = await WindowService.updateWindowStatuses();
        
        if (result.updated > 0) {
          logger.info(`Scheduled update: Updated ${result.updated} window statuses`);
        }
      } catch (error) {
        logger.error('Error in scheduled window status update:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    this.intervals.push(interval);
    logger.info('Scheduled window status updates: Every 5 minutes');
  }

  /**
   * Stop all scheduled tasks (for graceful shutdown)
   */
  static shutdown() {
    if (!this.isInitialized) {
      return;
    }

    logger.info('Shutting down SimpleSchedulerService...');
    
    // Clear all intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    
    this.intervals = [];
    this.isInitialized = false;
    logger.info('SimpleSchedulerService shut down successfully');
  }

  /**
   * Get status of all scheduled tasks
   */
  static getStatus() {
    return {
      initialized: this.isInitialized,
      taskCount: this.intervals.length,
      tasks: this.intervals.map((_, index) => ({
        id: index,
        name: index === 0 ? 'window-cleanup' : 'status-updates',
        status: 'active',
        type: 'interval'
      }))
    };
  }
}