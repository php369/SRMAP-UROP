/**
 * Simple frontend logger
 * In production, this should send logs to a service like Sentry
 */

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: string, message: string, data?: LogData): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level}: ${message}${dataStr}`;
  }

  info(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: LogData) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, data?: LogData) {
    console.error(this.formatMessage('ERROR', message, data));
    
    // In production, send to error tracking service
    if (!this.isDevelopment && window.Sentry) {
      window.Sentry.captureException(new Error(message), {
        extra: data,
      });
    }
  }

  debug(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

export const logger = new Logger();

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: any;
  }
}
