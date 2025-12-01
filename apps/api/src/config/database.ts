import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

export async function connectDatabase(): Promise<void> {
  try {
    // Configure mongoose options with optimized connection pooling
    const options = {
      // Connection pool settings
      maxPoolSize: 10,        // Maximum number of connections in the pool
      minPoolSize: 2,         // Minimum number of connections to maintain
      maxIdleTimeMS: 30000,   // Close idle connections after 30 seconds
      
      // Timeout settings
      serverSelectionTimeoutMS: 5000,  // Timeout for server selection
      socketTimeoutMS: 45000,          // Socket timeout
      connectTimeoutMS: 10000,         // Connection timeout
      
      // Retry settings
      retryWrites: true,      // Retry write operations
      retryReads: true,       // Retry read operations
      
      // Network settings
      family: 4,              // Use IPv4, skip trying IPv6
      
      // Other settings
      bufferCommands: false,  // Disable mongoose buffering
    };

    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, options);

    logger.info('✅ Connected to MongoDB with optimized connection pool', {
      maxPoolSize: options.maxPoolSize,
      minPoolSize: options.minPoolSize,
      maxIdleTimeMS: options.maxIdleTimeMS,
    });

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export { mongoose };