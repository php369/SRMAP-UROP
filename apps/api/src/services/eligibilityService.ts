import { Eligibility, IEligibility } from '../models/Eligibility';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Parse CSV data and validate emails
 * @param csvData - CSV string data
 * @returns Array of parsed records
 */
export function parseCSV(csvData: string): Array<{
    email: string;
    regNo?: string;
    year: number;
    semester: number;
}> {
    const lines = csvData.trim().split('\n');
    const records: Array<any> = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim());

        if (parts.length < 4) {
            throw new Error(`Invalid CSV format at line ${i + 1}. Expected: email,regNo,year,semester`);
        }

        const [email, regNo, year, semester] = parts;

        // Validate email domain
        if (!email.endsWith('@srmap.edu.in')) {
            throw new Error(`Invalid email domain at line ${i + 1}: ${email}`);
        }

        // Validate year
        const yearNum = parseInt(year);
        if (![2, 3, 4].includes(yearNum)) {
            throw new Error(`Invalid year at line ${i + 1}: ${year}. Must be 2, 3, or 4`);
        }

        // Validate semester
        const semesterNum = parseInt(semester);
        if (![3, 4, 7, 8].includes(semesterNum)) {
            throw new Error(`Invalid semester at line ${i + 1}: ${semester}. Must be 3, 4, 7, or 8`);
        }

        records.push({
            email: email.toLowerCase(),
            regNo: regNo || undefined,
            year: yearNum,
            semester: semesterNum
        });
    }

    return records;
}

/**
 * Determine term kind based on semester
 * @param semester - Semester number
 * @returns 'odd' or 'even'
 */
function getTermKind(semester: number): 'odd' | 'even' {
    // Odd semesters: 3, 7 (Jan-May)
    // Even semesters: 4, 8 (Aug-Dec)
    return [3, 7].includes(semester) ? 'odd' : 'even';
}

/**
 * Upload eligibility list from CSV
 * @param csvData - CSV string data
 * @param projectType - Project type
 * @param uploadedBy - Admin user ID
 * @returns Upload result
 */
export async function uploadEligibilityList(
    csvData: string,
    projectType: IEligibility['type'],
    uploadedBy: mongoose.Types.ObjectId
): Promise<{
    success: number;
    failed: number;
    errors: string[];
}> {
    try {
        const records = parseCSV(csvData);
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        // Set validity period (6 months from now)
        const validFrom = new Date();
        const validTo = new Date();
        validTo.setMonth(validTo.getMonth() + 6);

        for (const record of records) {
            try {
                const termKind = getTermKind(record.semester);

                // Check if eligibility already exists
                const existing = await Eligibility.findOne({
                    studentEmail: record.email,
                    type: projectType,
                    year: record.year,
                    semester: record.semester
                });

                if (existing) {
                    // Update existing
                    existing.validFrom = validFrom;
                    existing.validTo = validTo;
                    if (record.regNo) existing.regNo = record.regNo;
                    await existing.save();
                } else {
                    // Create new
                    await Eligibility.create({
                        studentEmail: record.email,
                        regNo: record.regNo,
                        year: record.year,
                        semester: record.semester,
                        termKind,
                        type: projectType,
                        validFrom,
                        validTo
                    });
                }

                success++;
            } catch (error: any) {
                failed++;
                const errorMsg = error.message || 'Unknown error';
                errors.push(`${record.email}: Eligibility validation failed: ${errorMsg}`);
                logger.error(`Failed to process ${record.email}:`, error);
            }
        }

        logger.info(`Eligibility upload completed: ${success} success, ${failed} failed`);
        return { success, failed, errors };
    } catch (error) {
        logger.error('Error uploading eligibility list:', error);
        throw error;
    }
}

/**
 * Get all eligibility records
 * @param filters - Optional filters
 * @returns Array of eligibility records
 */
export async function getEligibilityList(filters?: {
    projectType?: IEligibility['type'];
    year?: number;
    semester?: number;
}): Promise<IEligibility[]> {
    try {
        const query: any = {};
        if (filters?.projectType) query.type = filters.projectType;
        if (filters?.year) query.year = filters.year;
        if (filters?.semester) query.semester = filters.semester;

        return await Eligibility.find(query)
            .sort({ createdAt: -1 });
    } catch (error) {
        logger.error('Error getting eligibility list:', error);
        return [];
    }
}

/**
 * Check if user is eligible for a project type
 * @param email - User email
 * @param projectType - Project type
 * @returns Eligibility record or null
 */
export async function checkEligibility(
    email: string,
    projectType: IEligibility['type']
): Promise<IEligibility | null> {
    try {
        const now = new Date();
        return await Eligibility.findOne({
            studentEmail: email.toLowerCase(),
            type: projectType,
            validFrom: { $lte: now },
            validTo: { $gte: now }
        });
    } catch (error) {
        logger.error('Error checking eligibility:', error);
        return null;
    }
}

/**
 * Delete eligibility record
 * @param eligibilityId - Eligibility ID
 * @returns true if deleted
 */
export async function deleteEligibility(
    eligibilityId: string | mongoose.Types.ObjectId
): Promise<boolean> {
    try {
        const result = await Eligibility.findByIdAndDelete(eligibilityId);
        if (result) {
            logger.info(`Eligibility deleted: ${eligibilityId}`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Error deleting eligibility:', error);
        return false;
    }
}

/**
 * Deactivate eligibility records (set validTo to now)
 * @param filters - Filters to match records
 * @returns Number of deactivated records
 */
export async function deactivateEligibility(filters: {
    projectType?: IEligibility['type'];
    year?: number;
    semester?: number;
}): Promise<number> {
    try {
        const query: any = {};
        if (filters.projectType) query.type = filters.projectType;
        if (filters.year) query.year = filters.year;
        if (filters.semester) query.semester = filters.semester;

        const result = await Eligibility.updateMany(query, { validTo: new Date() });
        logger.info(`Deactivated ${result.modifiedCount} eligibility records`);
        return result.modifiedCount;
    } catch (error) {
        logger.error('Error deactivating eligibility:', error);
        return 0;
    }
}

/**
 * Get eligibility statistics
 * @returns Statistics object
 */
export async function getEligibilityStats(): Promise<{
    total: number;
    byProjectType: Record<string, number>;
    active: number;
    inactive: number;
}> {
    try {
        const now = new Date();
        const [total, active, byType] = await Promise.all([
            Eligibility.countDocuments(),
            Eligibility.countDocuments({
                validFrom: { $lte: now },
                validTo: { $gte: now }
            }),
            Eligibility.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ])
        ]);

        const byProjectType: Record<string, number> = {};
        byType.forEach((item: any) => {
            byProjectType[item._id] = item.count;
        });

        return {
            total,
            active,
            inactive: total - active,
            byProjectType
        };
    } catch (error) {
        logger.error('Error getting eligibility stats:', error);
        return {
            total: 0,
            active: 0,
            inactive: 0,
            byProjectType: {}
        };
    }
}
