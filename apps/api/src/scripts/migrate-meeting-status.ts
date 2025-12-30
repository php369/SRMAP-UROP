import { connectDatabase } from '../config/database';
import { MeetingLog } from '../models/MeetingLog';
import { logger } from '../utils/logger';

async function migrateMeetingStatus() {
  try {
    await connectDatabase();
    
    // Update all meetings with status 'submitted' to 'scheduled'
    const result = await MeetingLog.updateMany(
      { status: 'submitted' },
      { $set: { status: 'scheduled' } }
    );
    
    logger.info('Migration completed:', {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
    
    console.log(`✅ Migration completed: Updated ${result.modifiedCount} meetings from 'submitted' to 'scheduled'`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateMeetingStatus();