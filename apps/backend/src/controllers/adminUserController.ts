import { Request, Response } from 'express';
import { userManagementService } from '../services/userManagementService';
import { UserRole } from '@prisma/client';

export class AdminUserController {
    /**
     * GET /api/v1/admin/users
     * Get all users with filtering and pagination
     */
    async getAllUsers(req: Request, res: Response) {
        try {
            const {
                companyId,
                role,
                isActive,
                search,
                page = '1',
                limit = '50',
            } = req.query;

            const filters: any = {};
            if (companyId) filters.companyId = String(companyId);
            if (role) filters.role = role as UserRole;
            if (isActive !== undefined) filters.isActive = isActive === 'true';
            if (search) filters.search = String(search);

            // Company admins can only see users in their company
            if (req.user?.role === 'COMPANY_ADMIN' && req.user.companyId) {
                filters.companyId = req.user.companyId;
            }

            const result = await userManagementService.getAllUsers(
                filters,
                parseInt(String(page), 10),
                parseInt(String(limit), 10)
            );

            res.json({
                success: true,
                data: result,
                message: 'Users retrieved successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve users',
            });
        }
    }

    /**
     * GET /api/v1/admin/users/:id
     * Get user details by ID
     */
    async getUserById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const user = await userManagementService.getUserById(id);

            // Company admins can only view users in their company
            if (req.user?.role === 'COMPANY_ADMIN' && user.companyId !== req.user.companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot access users from other companies',
                });
            }

            res.json({
                success: true,
                data: user,
                message: 'User retrieved successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve user',
            });
        }
    }

    /**
     * POST /api/v1/admin/users
     * Create a new user
     */
    async createUser(req: Request, res: Response) {
        try {
            const { companyId, email, password, firstName, lastName, role } = req.body;

            // Validation
            if (!companyId || !email || !password || !firstName || !lastName || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: companyId, email, password, firstName, lastName, role',
                });
            }

            // Company admins can only create users in their own company
            if (req.user?.role === 'COMPANY_ADMIN') {
                if (companyId !== req.user.companyId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: Cannot create users for other companies',
                    });
                }

                // Company admins cannot create platform admins
                if (role === 'PLATFORM_ADMIN' || role === 'PLATFORM_SUPPORT') {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: Cannot create platform-level roles',
                    });
                }
            }

            const newUser = await userManagementService.createUser(
                { companyId, email, password, firstName, lastName, role },
                req.user!.id
            );

            res.status(201).json({
                success: true,
                data: newUser,
                message: 'User created successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to create user',
            });
        }
    }

    /**
     * PUT /api/v1/admin/users/:id
     * Update user information
     */
    async updateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { email, firstName, lastName, role, isActive, password } = req.body;

            // Get existing user to check permissions
            const existingUser = await userManagementService.getUserById(id);

            // Company admins can only update users in their company
            if (req.user?.role === 'COMPANY_ADMIN') {
                if (existingUser.companyId !== req.user.companyId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: Cannot update users from other companies',
                    });
                }

                // Company admins cannot change roles to platform-level
                if (role && (role === 'PLATFORM_ADMIN' || role === 'PLATFORM_SUPPORT')) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: Cannot assign platform-level roles',
                    });
                }
            }

            const updateData: any = {};
            if (email) updateData.email = email;
            if (firstName) updateData.firstName = firstName;
            if (lastName) updateData.lastName = lastName;
            if (role) updateData.role = role;
            if (isActive !== undefined) updateData.isActive = isActive;
            if (password) updateData.password = password;

            const updatedUser = await userManagementService.updateUser(id, updateData, req.user!.id);

            res.json({
                success: true,
                data: updatedUser,
                message: 'User updated successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to update user',
            });
        }
    }

    /**
     * DELETE /api/v1/admin/users/:id
     * Delete or deactivate a user
     */
    async deleteUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { hardDelete = false } = req.query;

            // Get existing user to check permissions
            const existingUser = await userManagementService.getUserById(id);

            // Company admins can only delete users in their company
            if (req.user?.role === 'COMPANY_ADMIN' && existingUser.companyId !== req.user.companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot delete users from other companies',
                });
            }

            // Only platform admins can hard delete
            if (hardDelete === 'true' && req.user?.role !== 'PLATFORM_ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Only platform admins can permanently delete users',
                });
            }

            const result = await userManagementService.deleteUser(
                id,
                req.user!.id,
                hardDelete === 'true'
            );

            res.json({
                success: true,
                data: result,
                message: result.hardDelete ? 'User permanently deleted' : 'User deactivated successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to delete user',
            });
        }
    }

    /**
     * POST /api/v1/admin/users/:id/reactivate
     * Reactivate a deactivated user
     */
    async reactivateUser(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get existing user to check permissions
            const existingUser = await userManagementService.getUserById(id);

            // Company admins can only reactivate users in their company
            if (req.user?.role === 'COMPANY_ADMIN' && existingUser.companyId !== req.user.companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot reactivate users from other companies',
                });
            }

            const reactivatedUser = await userManagementService.reactivateUser(id, req.user!.id);

            res.json({
                success: true,
                data: reactivatedUser,
                message: 'User reactivated successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to reactivate user',
            });
        }
    }

    /**
     * POST /api/v1/admin/users/:id/reset-password
     * Reset user password
     */
    async resetPassword(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long',
                });
            }

            // Get existing user to check permissions
            const existingUser = await userManagementService.getUserById(id);

            // Company admins can only reset passwords for users in their company
            if (req.user?.role === 'COMPANY_ADMIN' && existingUser.companyId !== req.user.companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot reset passwords for users from other companies',
                });
            }

            await userManagementService.resetPassword(id, newPassword, req.user!.id);

            res.json({
                success: true,
                message: 'Password reset successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to reset password',
            });
        }
    }

    /**
     * GET /api/v1/admin/users/:id/stats
     * Get user activity statistics
     */
    async getUserStats(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Get existing user to check permissions
            const existingUser = await userManagementService.getUserById(id);

            // Company admins can only view stats for users in their company
            if (req.user?.role === 'COMPANY_ADMIN' && existingUser.companyId !== req.user.companyId) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot view stats for users from other companies',
                });
            }

            const stats = await userManagementService.getUserStats(id);

            res.json({
                success: true,
                data: stats,
                message: 'User stats retrieved successfully',
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to retrieve user stats',
            });
        }
    }

    /**
     * POST /api/v1/admin/users/bulk-deactivate
     * Bulk deactivate multiple users
     */
    async bulkDeactivate(req: Request, res: Response) {
        try {
            const { userIds } = req.body;

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'userIds must be a non-empty array',
                });
            }

            // Company admins can only deactivate users in their company
            if (req.user?.role === 'COMPANY_ADMIN') {
                // Verify all users belong to the admin's company
                const users = await Promise.all(
                    userIds.map(id => userManagementService.getUserById(id).catch(() => null))
                );

                const invalidUsers = users.filter(u => u && u.companyId !== req.user?.companyId);
                if (invalidUsers.length > 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: Cannot deactivate users from other companies',
                    });
                }
            }

            const result = await userManagementService.bulkDeactivate(userIds, req.user!.id);

            res.json({
                success: true,
                data: result,
                message: `${result.count} users deactivated successfully`,
            });
        } catch (error: any) {
            res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Failed to bulk deactivate users',
            });
        }
    }
}

export const adminUserController = new AdminUserController();
