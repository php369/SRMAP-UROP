import { Cohort, ICohort } from '../models/Cohort';
import { User } from '../models/User';
import mongoose from 'mongoose';

export class CohortService {
    /**
     * Create a new cohort
     */
    async createCohort(data: {
        name: string;
        year: number;
        department: string;
        members?: mongoose.Types.ObjectId[];
    }): Promise<ICohort> {
        // Check if cohort with same name already exists
        const existingCohort = await Cohort.findOne({ name: data.name });
        if (existingCohort) {
            throw new Error('Cohort with this name already exists');
        }

        // Validate members exist if provided
        if (data.members && data.members.length > 0) {
            const users = await User.find({ _id: { $in: data.members } });
            if (users.length !== data.members.length) {
                throw new Error('One or more members not found');
            }
        }

        const cohort = new Cohort({
            name: data.name,
            year: data.year,
            department: data.department,
            members: data.members || [],
            status: 'active'
        });

        await cohort.save();
        return cohort;
    }

    /**
     * Get cohort by ID
     */
    async getCohortById(cohortId: string): Promise<ICohort | null> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        const cohort = await Cohort.findById(cohortId).populate('members', 'name email role');
        return cohort;
    }

    /**
     * Get all cohorts with optional filters
     */
    async getCohorts(filters?: {
        year?: number;
        department?: string;
        status?: 'active' | 'inactive';
    }): Promise<ICohort[]> {
        const query: any = {};

        if (filters?.year) {
            query.year = filters.year;
        }

        if (filters?.department) {
            query.department = filters.department;
        }

        if (filters?.status) {
            query.status = filters.status;
        }

        const cohorts = await Cohort.find(query)
            .populate('members', 'name email role')
            .sort({ year: -1, name: 1 });

        return cohorts;
    }

    /**
     * Update cohort details
     */
    async updateCohort(
        cohortId: string,
        updates: {
            name?: string;
            year?: number;
            department?: string;
            status?: 'active' | 'inactive';
        }
    ): Promise<ICohort | null> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        // If updating name, check for duplicates
        if (updates.name) {
            const existingCohort = await Cohort.findOne({
                name: updates.name,
                _id: { $ne: cohortId }
            });
            if (existingCohort) {
                throw new Error('Cohort with this name already exists');
            }
        }

        const cohort = await Cohort.findByIdAndUpdate(
            cohortId,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('members', 'name email role');

        return cohort;
    }

    /**
     * Add members to cohort
     */
    async addMembers(cohortId: string, memberIds: mongoose.Types.ObjectId[]): Promise<ICohort | null> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        // Validate all members exist
        const users = await User.find({ _id: { $in: memberIds } });
        if (users.length !== memberIds.length) {
            throw new Error('One or more members not found');
        }

        const cohort = await Cohort.findByIdAndUpdate(
            cohortId,
            { $addToSet: { members: { $each: memberIds } } },
            { new: true }
        ).populate('members', 'name email role');

        return cohort;
    }

    /**
     * Remove members from cohort
     */
    async removeMembers(cohortId: string, memberIds: mongoose.Types.ObjectId[]): Promise<ICohort | null> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        const cohort = await Cohort.findByIdAndUpdate(
            cohortId,
            { $pull: { members: { $in: memberIds } } },
            { new: true }
        ).populate('members', 'name email role');

        return cohort;
    }

    /**
     * Delete cohort
     */
    async deleteCohort(cohortId: string): Promise<boolean> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        const result = await Cohort.findByIdAndDelete(cohortId);
        return !!result;
    }

    /**
     * Get cohorts for a specific user
     */
    async getUserCohorts(userId: string): Promise<ICohort[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID');
        }

        const cohorts = await Cohort.find({
            members: userId,
            status: 'active'
        }).sort({ year: -1, name: 1 });

        return cohorts;
    }

    /**
     * Bulk add users to cohort by email
     */
    async bulkAddMembersByEmail(cohortId: string, emails: string[]): Promise<{
        added: number;
        notFound: string[];
        alreadyInCohort: string[];
    }> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        const cohort = await Cohort.findById(cohortId);
        if (!cohort) {
            throw new Error('Cohort not found');
        }

        // Find users by email
        const users = await User.find({ email: { $in: emails } });
        const foundEmails = users.map(u => u.email);
        const notFound = emails.filter(e => !foundEmails.includes(e));

        // Check which users are already in cohort
        const existingMemberIds = cohort.members.map(m => m.toString());
        const newUsers = users.filter(u => !existingMemberIds.includes(u._id.toString()));
        const alreadyInCohort = users
            .filter(u => existingMemberIds.includes(u._id.toString()))
            .map(u => u.email);

        // Add new members
        if (newUsers.length > 0) {
            await Cohort.findByIdAndUpdate(
                cohortId,
                { $addToSet: { members: { $each: newUsers.map(u => u._id) } } }
            );
        }

        return {
            added: newUsers.length,
            notFound,
            alreadyInCohort
        };
    }

    /**
     * Get cohort statistics
     */
    async getCohortStats(cohortId: string): Promise<{
        totalMembers: number;
        membersByRole: { [key: string]: number };
        status: string;
    }> {
        if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            throw new Error('Invalid cohort ID');
        }

        const cohort = await Cohort.findById(cohortId).populate('members', 'role');
        if (!cohort) {
            throw new Error('Cohort not found');
        }

        const membersByRole: { [key: string]: number } = {};
        cohort.members.forEach((member: any) => {
            const role = member.role || 'unknown';
            membersByRole[role] = (membersByRole[role] || 0) + 1;
        });

        return {
            totalMembers: cohort.members.length,
            membersByRole,
            status: cohort.status
        };
    }
}

export const cohortService = new CohortService();
