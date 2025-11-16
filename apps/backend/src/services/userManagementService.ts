import prisma from '../../prisma/db';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { auditService } from './auditService';

interface CreateUserDto {
    companyId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

interface UpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isActive?: boolean;
    password?: string;
}

interface UserFilters {
    companyId?: string;
    role?: UserRole;
    isActive?: boolean;
    search?: string; // Search by email, firstName, or lastName
}

class UserManagementService {
    /**
     * Get all users with filtering and pagination
     */
    async getAllUsers(filters: UserFilters = {}, page = 1, limit = 50) {
        const { companyId, role, isActive, search } = filters;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (companyId) where.companyId = companyId;
        if (role) where.role = role;
        if (isActive !== undefined) where.isActive = isActive;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    companyId: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get user by ID with detailed information
     */
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                companyId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                        whatsappPhone: true,
                    },
                },
                _count: {
                    select: {
                        messages: true,
                        scheduledMessages: true,
                        auditLogs: true,
                    },
                },
            },
        });

        if (!user) {
            const error: any = new Error('User not found');
            error.status = 404;
            throw error;
        }

        return user;
    }

    /**
     * Create a new user
     */
    async createUser(data: CreateUserDto, adminUserId: string) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            const error: any = new Error('Email already in use');
            error.status = 400;
            throw error;
        }

        // Verify company exists
        const company = await prisma.company.findUnique({
            where: { id: data.companyId },
        });

        if (!company) {
            const error: any = new Error('Company not found');
            error.status = 404;
            throw error;
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(data.password, saltRounds);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                companyId: data.companyId,
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            },
            select: {
                id: true,
                companyId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await auditService.log({
            companyId: data.companyId,
            userId: adminUserId,
            action: 'USER_CREATED',
            resourceId: newUser.id,
            resourceType: 'User',
            details: JSON.stringify({
                email: newUser.email,
                role: newUser.role,
                createdBy: adminUserId,
            }),
        });

        return newUser;
    }

    /**
     * Update user information
     */
    async updateUser(userId: string, data: UpdateUserDto, adminUserId: string) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            const error: any = new Error('User not found');
            error.status = 404;
            throw error;
        }

        // If updating email, check for conflicts
        if (data.email && data.email !== existingUser.email) {
            const emailConflict = await prisma.user.findUnique({
                where: { email: data.email },
            });

            if (emailConflict) {
                const error: any = new Error('Email already in use');
                error.status = 400;
                throw error;
            }
        }

        // Prepare update data
        const updateData: any = {};
        if (data.email) updateData.email = data.email;
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;
        if (data.role) updateData.role = data.role;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        // Hash new password if provided
        if (data.password) {
            const saltRounds = 12;
            updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                companyId: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await auditService.log({
            companyId: existingUser.companyId,
            userId: adminUserId,
            action: 'USER_UPDATED',
            resourceId: userId,
            resourceType: 'User',
            details: JSON.stringify({
                changes: data,
                updatedBy: adminUserId,
            }),
        });

        return updatedUser;
    }

    /**
     * Delete user (soft delete by deactivating)
     */
    async deleteUser(userId: string, adminUserId: string, hardDelete = false) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            const error: any = new Error('User not found');
            error.status = 404;
            throw error;
        }

        // Prevent self-deletion
        if (userId === adminUserId) {
            const error: any = new Error('Cannot delete your own account');
            error.status = 400;
            throw error;
        }

        if (hardDelete) {
            // Hard delete - permanently remove user
            await prisma.user.delete({
                where: { id: userId },
            });
        } else {
            // Soft delete - deactivate user
            await prisma.user.update({
                where: { id: userId },
                data: { isActive: false },
            });
        }

        // Audit log
        await auditService.log({
            companyId: user.companyId,
            userId: adminUserId,
            action: 'USER_DELETED',
            resourceId: userId,
            resourceType: 'User',
            details: JSON.stringify({
                email: user.email,
                hardDelete,
                deletedBy: adminUserId,
            }),
        });

        return { success: true, hardDelete };
    }

    /**
     * Reactivate a deactivated user
     */
    async reactivateUser(userId: string, adminUserId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            const error: any = new Error('User not found');
            error.status = 404;
            throw error;
        }

        if (user.isActive) {
            const error: any = new Error('User is already active');
            error.status = 400;
            throw error;
        }

        const reactivatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
            },
        });

        // Audit log
        await auditService.log({
            companyId: user.companyId,
            userId: adminUserId,
            action: 'USER_UPDATED',
            resourceId: userId,
            resourceType: 'User',
            details: JSON.stringify({
                action: 'reactivated',
                reactivatedBy: adminUserId,
            }),
        });

        return reactivatedUser;
    }

    /**
     * Reset user password
     */
    async resetPassword(userId: string, newPassword: string, adminUserId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            const error: any = new Error('User not found');
            error.status = 404;
            throw error;
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        // Audit log
        await auditService.log({
            companyId: user.companyId,
            userId: adminUserId,
            action: 'USER_UPDATED',
            resourceId: userId,
            resourceType: 'User',
            details: JSON.stringify({
                action: 'password_reset',
                resetBy: adminUserId,
            }),
        });

        return { success: true };
    }

    /**
     * Get user activity statistics
     */
    async getUserStats(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            const error: any = new Error('User not found');
            error.status = 404;
            throw error;
        }

        const [messageCount, scheduleCount, recentAuditLogs] = await Promise.all([
            prisma.message.count({ where: { userId } }),
            prisma.scheduledMessage.count({ where: { userId } }),
            prisma.auditLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    action: true,
                    resourceType: true,
                    createdAt: true,
                },
            }),
        ]);

        return {
            userId,
            messagesSent: messageCount,
            schedulesCreated: scheduleCount,
            lastLoginAt: user.lastLoginAt,
            recentActivity: recentAuditLogs,
        };
    }

    /**
     * Bulk operations - deactivate multiple users
     */
    async bulkDeactivate(userIds: string[], adminUserId: string) {
        // Prevent self-deactivation
        const filteredIds = userIds.filter(id => id !== adminUserId);

        if (filteredIds.length === 0) {
            const error: any = new Error('No valid users to deactivate');
            error.status = 400;
            throw error;
        }

        const result = await prisma.user.updateMany({
            where: {
                id: { in: filteredIds },
            },
            data: { isActive: false },
        });

        // Audit log for bulk operation
        const users = await prisma.user.findMany({
            where: { id: { in: filteredIds } },
            select: { id: true, companyId: true },
        });

        for (const user of users) {
            await auditService.log({
                companyId: user.companyId,
                userId: adminUserId,
                action: 'USER_UPDATED',
                resourceId: user.id,
                resourceType: 'User',
                details: JSON.stringify({
                    action: 'bulk_deactivate',
                    deactivatedBy: adminUserId,
                }),
            });
        }

        return { success: true, count: result.count };
    }
}

export const userManagementService = new UserManagementService();
