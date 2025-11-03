// Simple console logger for development
// TODO: Replace with winston in production (Task 17.2)

interface LogLevel {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  http: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

const createLogger = (): LogLevel => {
  const timestamp = () => new Date().toISOString();
  
  return {
    error: (message: string, ...args: any[]) => {
      console.error(`[${timestamp()}] ERROR: ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[${timestamp()}] WARN: ${message}`, ...args);
    },
    info: (message: string, ...args: any[]) => {
      console.info(`[${timestamp()}] INFO: ${message}`, ...args);
    },
    http: (message: string, ...args: any[]) => {
      console.log(`[${timestamp()}] HTTP: ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[${timestamp()}] DEBUG: ${message}`, ...args);
      }
    },
  };
};

export const logger = createLogger();
export const requestLogger = logger; // Same instance for now