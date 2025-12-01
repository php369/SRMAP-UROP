import mongoose from 'mongoose';
import {
  importEligibilityFromCSV,
  importFacultyRosterFromCSV,
  getEligibilityRecords,
  getFacultyRosterRecords,
  updateFacultyRosterRecord,
} from '../../services/adminService';
import { Eligibility } from '../../models/Eligibility';
import { FacultyRoster } from '../../models/FacultyRoster';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';
import { beforeEach } from 'node:test';

describe('AdminService', () => {
  beforeAll(async () => {
    // Use the global MongoDB connection from globalSetup
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
  });

  beforeEach(async () => {
    await Eligibility.deleteMany({});
    await FacultyRoster.deleteMany({});
  });

  describe('CSV Import - Eligibility', () => {
    test('should import valid eligibility CSV successfully', async () => {
      const csvContent = `studentEmail,regNo,year,semester,termKind,type
student1@srmap.edu.in,AP21110010001,3,7,odd,IDP
student2@srmap.edu.in,AP21110010002,4,8,even,CAPSTONE
student3@srmap.edu.in,AP21110010003,3,7,odd,UROP`;

      const result = await importEligibilityFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(3);
      expect(result.errors).toBe(0);
      expect(result.total).toBe(3);

      // Verify records were created
      const records = await Eligibility.find({});
      expect(records).toHaveLength(3);

      const student1 = records.find(r => r.studentEmail === 'student1@srmap.edu.in');
      expect(student1).toBeDefined();
      expect(student1?.type).toBe('IDP');
      expect(student1?.year).toBe(3);
      expect(student1?.semester).toBe(7);
      expect(student1?.termKind).toBe('odd');
    });

    test('should handle CSV with validation errors', async () => {
      const csvContent = `studentEmail,regNo,year,semester,termKind,type
invalid-email,AP21110010001,3,7,odd,IDP
student2@gmail.com,AP21110010002,4,8,even,CAPSTONE
student3@srmap.edu.in,AP21110010003,5,7,odd,INVALID_TYPE
student4@srmap.edu.in,AP21110010004,3,9,odd,IDP`;

      const result = await importEligibilityFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(0);
      expect(result.errors).toBe(4);
      expect(result.errorDetails).toHaveLength(4);

      // Check specific error messages
      expect(result.errorDetails[0].error).toContain('Student email must be from @srmap.edu.in domain');
      expect(result.errorDetails[1].error).toContain('Student email must be from @srmap.edu.in domain');
      expect(result.errorDetails[2].error).toContain('Type must be \'IDP\', \'UROP\', or \'CAPSTONE\'');
      expect(result.errorDetails[3].error).toContain('Semester must be 3, 4, 7, or 8');
    });

    test('should handle upsert functionality', async () => {
      // First import
      const csvContent1 = `studentEmail,regNo,year,semester,termKind,type
student1@srmap.edu.in,AP21110010001,3,7,odd,IDP`;

      await importEligibilityFromCSV(csvContent1, 'admin123');

      // Second import with updated data
      const csvContent2 = `studentEmail,regNo,year,semester,termKind,type
student1@srmap.edu.in,AP21110010001_UPDATED,3,7,odd,IDP`;

      const result = await importEligibilityFromCSV(csvContent2, 'admin123');

      expect(result.success).toBe(1);
      expect(result.errors).toBe(0);

      // Verify only one record exists with updated data
      const records = await Eligibility.find({});
      expect(records).toHaveLength(1);
      expect(records[0].regNo).toBe('AP21110010001_UPDATED');
    });

    test('should handle empty CSV file', async () => {
      const csvContent = '';

      await expect(importEligibilityFromCSV(csvContent, 'admin123'))
        .rejects.toThrow('CSV file is empty');
    });

    test('should validate required fields', async () => {
      const csvContent = `studentEmail,regNo,year,semester,termKind,type
,AP21110010001,3,7,odd,IDP
student2@srmap.edu.in,,,,odd,IDP`;

      const result = await importEligibilityFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(0);
      expect(result.errors).toBe(2);
      expect(result.errorDetails[0].error).toContain('Student email is required');
      expect(result.errorDetails[1].error).toContain('Valid year is required');
    });

    test('should set correct validity dates based on term kind', async () => {
      const csvContent = `studentEmail,regNo,year,semester,termKind,type
student1@srmap.edu.in,AP21110010001,3,7,odd,IDP
student2@srmap.edu.in,AP21110010002,3,8,even,CAPSTONE`;

      await importEligibilityFromCSV(csvContent, 'admin123');

      const records = await Eligibility.find({}).sort({ studentEmail: 1 });
      const currentYear = new Date().getFullYear();

      // Odd semester: Jan-May
      const oddRecord = records[0];
      expect(oddRecord.validFrom).toEqual(new Date(currentYear, 0, 1));
      expect(oddRecord.validTo).toEqual(new Date(currentYear, 4, 31));

      // Even semester: Aug-Dec
      const evenRecord = records[1];
      expect(evenRecord.validFrom).toEqual(new Date(currentYear, 7, 1));
      expect(evenRecord.validTo).toEqual(new Date(currentYear, 11, 31));
    });
  });

  describe('CSV Import - Faculty Roster', () => {
    test('should import valid faculty roster CSV successfully', async () => {
      const csvContent = `email,name,dept,isCoordinator,active
faculty1@srmap.edu.in,Dr. John Doe,CSE,true,true
faculty2@srmap.edu.in,Dr. Jane Smith,ECE,false,true
faculty3@srmap.edu.in,Dr. Bob Johnson,MECH,false,false`;

      const result = await importFacultyRosterFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(3);
      expect(result.errors).toBe(0);
      expect(result.total).toBe(3);

      // Verify records were created
      const records = await FacultyRoster.find({});
      expect(records).toHaveLength(3);

      const coordinator = records.find(r => r.email === 'faculty1@srmap.edu.in');
      expect(coordinator).toBeDefined();
      expect(coordinator?.isCoordinator).toBe(true);
      expect(coordinator?.active).toBe(true);

      const inactiveFaculty = records.find(r => r.email === 'faculty3@srmap.edu.in');
      expect(inactiveFaculty?.active).toBe(false);
    });

    test('should handle faculty roster validation errors', async () => {
      const csvContent = `email,name,dept,isCoordinator,active
invalid-email,Dr. John Doe,CSE,true,true
faculty2@gmail.com,Dr. Jane Smith,ECE,false,true
faculty3@srmap.edu.in,,MECH,false,false`;

      const result = await importFacultyRosterFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(0);
      expect(result.errors).toBe(3);
      expect(result.errorDetails[0].error).toContain('Email must be from @srmap.edu.in domain');
      expect(result.errorDetails[1].error).toContain('Email must be from @srmap.edu.in domain');
      expect(result.errorDetails[2].error).toContain('Name is required');
    });

    test('should handle boolean field parsing', async () => {
      const csvContent = `email,name,dept,isCoordinator,active
faculty1@srmap.edu.in,Dr. John Doe,CSE,1,yes
faculty2@srmap.edu.in,Dr. Jane Smith,ECE,0,no
faculty3@srmap.edu.in,Dr. Bob Johnson,MECH,true,false`;

      const result = await importFacultyRosterFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(3);

      const records = await FacultyRoster.find({}).sort({ email: 1 });
      expect(records[0].isCoordinator).toBe(true);
      expect(records[0].active).toBe(true);
      expect(records[1].isCoordinator).toBe(false);
      expect(records[1].active).toBe(false);
      expect(records[2].isCoordinator).toBe(true);
      expect(records[2].active).toBe(false);
    });

    test('should handle default values for optional fields', async () => {
      const csvContent = `email,name,dept
faculty1@srmap.edu.in,Dr. John Doe,CSE`;

      const result = await importFacultyRosterFromCSV(csvContent, 'admin123');

      expect(result.success).toBe(1);

      const record = await FacultyRoster.findOne({ email: 'faculty1@srmap.edu.in' });
      expect(record?.isCoordinator).toBe(false);
      expect(record?.active).toBe(true);
    });
  });

  describe('getEligibilityRecords', () => {
    beforeEach(async () => {
      await Eligibility.create([
        {
          studentEmail: 'student1@srmap.edu.in',
          regNo: 'AP21110010001',
          year: 3,
          semester: 7,
          termKind: 'odd',
          type: 'IDP',
          validFrom: new Date(),
          validTo: new Date(),
        },
        {
          studentEmail: 'student2@srmap.edu.in',
          regNo: 'AP21110010002',
          year: 4,
          semester: 8,
          termKind: 'even',
          type: 'CAPSTONE',
          validFrom: new Date(),
          validTo: new Date(),
        },
      ]);
    });

    test('should get all eligibility records without filters', async () => {
      const records = await getEligibilityRecords();
      expect(records).toHaveLength(2);
    });

    test('should filter by type', async () => {
      const records = await getEligibilityRecords({ type: 'IDP' });
      expect(records).toHaveLength(1);
      expect(records[0].type).toBe('IDP');
    });

    test('should filter by search term', async () => {
      const records = await getEligibilityRecords({ search: 'student1' });
      expect(records).toHaveLength(1);
      expect(records[0].studentEmail).toBe('student1@srmap.edu.in');
    });

    test('should apply limit and skip', async () => {
      const records = await getEligibilityRecords({ limit: 1, skip: 1 });
      expect(records).toHaveLength(1);
    });
  });

  describe('getFacultyRosterRecords', () => {
    beforeEach(async () => {
      await FacultyRoster.create([
        {
          email: 'faculty1@srmap.edu.in',
          name: 'Dr. John Doe',
          dept: 'CSE',
          isCoordinator: true,
          active: true,
        },
        {
          email: 'faculty2@srmap.edu.in',
          name: 'Dr. Jane Smith',
          dept: 'ECE',
          isCoordinator: false,
          active: false,
        },
      ]);
    });

    test('should get all faculty records without filters', async () => {
      const records = await getFacultyRosterRecords();
      expect(records).toHaveLength(2);
    });

    test('should filter by department', async () => {
      const records = await getFacultyRosterRecords({ dept: 'CSE' });
      expect(records).toHaveLength(1);
      expect(records[0].dept).toBe('CSE');
    });

    test('should filter by coordinator status', async () => {
      const records = await getFacultyRosterRecords({ isCoordinator: true });
      expect(records).toHaveLength(1);
      expect(records[0].isCoordinator).toBe(true);
    });

    test('should filter by active status', async () => {
      const records = await getFacultyRosterRecords({ active: false });
      expect(records).toHaveLength(1);
      expect(records[0].active).toBe(false);
    });

    test('should search by name or email', async () => {
      const records = await getFacultyRosterRecords({ search: 'Jane' });
      expect(records).toHaveLength(1);
      expect(records[0].name).toBe('Dr. Jane Smith');
    });
  });

  describe('updateFacultyRosterRecord', () => {
    let facultyId: string;

    beforeEach(async () => {
      const faculty = await FacultyRoster.create({
        email: 'faculty@srmap.edu.in',
        name: 'Dr. John Doe',
        dept: 'CSE',
        isCoordinator: false,
        active: true,
      });
      facultyId = faculty._id.toString();
    });

    test('should update faculty record successfully', async () => {
      const updated = await updateFacultyRosterRecord(
        facultyId,
        {
          name: 'Dr. John Smith',
          isCoordinator: true,
          active: false,
        },
        'admin123'
      );

      expect(updated.name).toBe('Dr. John Smith');
      expect(updated.isCoordinator).toBe(true);
      expect(updated.active).toBe(false);
    });

    test('should handle partial updates', async () => {
      const updated = await updateFacultyRosterRecord(
        facultyId,
        { isCoordinator: true },
        'admin123'
      );

      expect(updated.name).toBe('Dr. John Doe'); // Unchanged
      expect(updated.isCoordinator).toBe(true); // Changed
      expect(updated.active).toBe(true); // Unchanged
    });

    test('should throw error for non-existent faculty', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        updateFacultyRosterRecord(fakeId, { name: 'New Name' }, 'admin123')
      ).rejects.toThrow('Faculty not found');
    });
  });
});