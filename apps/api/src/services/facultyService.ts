import { FacultyRoster, IFacultyRoster } from '../models/FacultyRoster';
import { logger } from '../utils/logger';

/**
 * Parse Faculty CSV data
 * Expected format: email,name,department,isCoordinator
 * @param csvData - CSV string data
 * @returns Array of parsed faculty records
 */
export function parseFacultyCSV(csvData: string): Array<{
    email: string;
    name: string;
    dept: string;
    isCoordinator: boolean;
}> {
    const lines = csvData.trim().split('\n');
    const records: Array<any> = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(p => p.trim());

        if (parts.length < 3) {
            throw new Error(`Invalid CSV format at line ${i + 1}. Expected: email,name,department[,isCoordinator]`);
        }

        const [email, name, dept, isCoordinatorStr] = parts;

        // Validate email domain
        if (!email.endsWith('@srmap.edu.in')) {
            throw new Error(`Invalid email domain at line ${i + 1}: ${email}. Must end with @srmap.edu.in`);
        }

        // Validate name
        if (!name || name.length === 0) {
            throw new Error(`Name is required at line ${i + 1}`);
        }

        // Validate department
        if (!dept || dept.length === 0) {
            throw new Error(`Department is required at line ${i + 1}`);
        }

        // Parse isCoordinator (optional, defaults to false)
        const isCoordinator = isCoordinatorStr
            ? ['true', '1', 'yes', 'y'].includes(isCoordinatorStr.toLowerCase())
            : false;

        records.push({
            email: email.toLowerCase(),
            name,
            dept,
            isCoordinator
        });
    }

    return records;
}

/**
 * Upload faculty roster from CSV
 * @param csvData - CSV string data
 * @returns Upload result
 */
export async function uploadFacultyRoster(
    csvData: string
): Promise<{
    successful: number;
    failed: number;
    errors: string[];
    updated: number;
    total: number;
}> {
    try {
        const records = parseFacultyCSV(csvData);
        let success = 0;
        let failed = 0;
        let updated = 0;
        const errors: string[] = [];

        for (const record of records) {
            try {
                // Check if faculty already exists
                const existing = await FacultyRoster.findOne({ email: record.email });

                if (existing) {
                    // Update existing record
                    existing.name = record.name;
                    existing.dept = record.dept;
                    existing.isCoordinator = record.isCoordinator;
                    existing.active = true;
                    await existing.save();
                    updated++;
                    logger.info(`Updated faculty: ${record.email}`);
                } else {
                    // Create new faculty record
                    const faculty = new FacultyRoster({
                        email: record.email,
                        name: record.name,
                        dept: record.dept,
                        isCoordinator: record.isCoordinator,
                        active: true
                    });
                    await faculty.save();
                    success++;
                    logger.info(`Created faculty: ${record.email}`);
                }
            } catch (error: any) {
                failed++;
                const errorMsg = `Failed to process ${record.email}: ${error.message}`;
                errors.push(errorMsg);
                logger.error(errorMsg);
            }
        }

        return {
            successful: success,
            failed,
            errors,
            updated,
            total: success + updated + failed
        };
    } catch (error: any) {
        logger.error('Failed to upload faculty roster:', error);
        throw new Error(`CSV parsing failed: ${error.message}`);
    }
}

/**
 * Get all faculty roster records with optional filters
 * @param filters - Optional filters
 * @returns List of faculty records
 */
export async function getFacultyRoster(filters?: {
    dept?: string;
    isCoordinator?: boolean;
    active?: boolean;
}): Promise<IFacultyRoster[]> {
    try {
        const query: any = {};

        if (filters?.dept) {
            query.dept = filters.dept;
        }

        if (filters?.isCoordinator !== undefined) {
            query.isCoordinator = filters.isCoordinator;
        }

        if (filters?.active !== undefined) {
            query.active = filters.active;
        }

        const faculty = await FacultyRoster.find(query).sort({ name: 1 });
        return faculty;
    } catch (error) {
        logger.error('Failed to get faculty roster:', error);
        throw error;
    }
}

/**
 * Update faculty roster record
 * @param email - Faculty email
 * @param updates - Fields to update
 * @returns Updated faculty record
 */
export async function updateFacultyRecord(
    email: string,
    updates: Partial<Pick<IFacultyRoster, 'name' | 'dept' | 'isCoordinator' | 'active'>>
): Promise<IFacultyRoster | null> {
    try {
        const faculty = await FacultyRoster.findOneAndUpdate(
            { email: email.toLowerCase() },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (faculty) {
            logger.info(`Updated faculty record: ${email}`);
        }

        return faculty;
    } catch (error) {
        logger.error(`Failed to update faculty record ${email}:`, error);
        throw error;
    }
}

/**
 * Delete faculty roster record
 * @param email - Faculty email
 * @returns Success boolean
 */
export async function deleteFacultyRecord(email: string): Promise<boolean> {
    try {
        const result = await FacultyRoster.deleteOne({ email: email.toLowerCase() });

        if (result.deletedCount > 0) {
            logger.info(`Deleted faculty record: ${email}`);
            return true;
        }

        return false;
    } catch (error) {
        logger.error(`Failed to delete faculty record ${email}:`, error);
        throw error;
    }
}
