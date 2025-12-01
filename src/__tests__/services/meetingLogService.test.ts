import { MeetingLogService } from '../../services/meetingLogService';
import { MeetingLog } from '../../models/MeetingLog';
import { afterEach } from 'node:test';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('MeetingLogService', () => {
  describe('canEditMeetingLog', () => {
    it('should return false for non-existent meeting log', async () => {
      // Mock MeetingLog.findById to return null
      jest.spyOn(MeetingLog, 'findById').mockResolvedValue(null);

      const canEdit = await MeetingLogService.canEditMeetingLog('507f1f77bcf86cd799439011' as any);
      expect(canEdit).toBe(false);
    });

    it('should return true for submitted meeting log', async () => {
      // Mock MeetingLog.findById to return a submitted log
      const mockLog = { status: 'submitted' };
      jest.spyOn(MeetingLog, 'findById').mockResolvedValue(mockLog as any);

      const canEdit = await MeetingLogService.canEditMeetingLog('507f1f77bcf86cd799439011' as any);
      expect(canEdit).toBe(true);
    });

    it('should return true for rejected meeting log', async () => {
      // Mock MeetingLog.findById to return a rejected log
      const mockLog = { status: 'rejected' };
      jest.spyOn(MeetingLog, 'findById').mockResolvedValue(mockLog as any);

      const canEdit = await MeetingLogService.canEditMeetingLog('507f1f77bcf86cd799439011' as any);
      expect(canEdit).toBe(true);
    });

    it('should return false for approved meeting log', async () => {
      // Mock MeetingLog.findById to return an approved log
      const mockLog = { status: 'approved' };
      jest.spyOn(MeetingLog, 'findById').mockResolvedValue(mockLog as any);

      const canEdit = await MeetingLogService.canEditMeetingLog('507f1f77bcf86cd799439011' as any);
      expect(canEdit).toBe(false);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});