import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as adminApi from './api';
import type { UserFilters, CreateUserDto, UpdateUserDto } from './api';

// Get all users with filters
export function useAdminUsers(filters: UserFilters = {}) {
    return useQuery({
        queryKey: ['admin', 'users', filters],
        queryFn: () => adminApi.getAllUsers(filters),
        staleTime: 30000, // 30 seconds
    });
}

// Get user by ID
export function useAdminUser(userId: string | undefined) {
    return useQuery({
        queryKey: ['admin', 'user', userId],
        queryFn: () => {
            if (!userId) throw new Error('User ID is required');
            return adminApi.getUserById(userId);
        },
        enabled: !!userId,
    });
}

// Get user stats
export function useUserStats(userId: string | undefined) {
    return useQuery({
        queryKey: ['admin', 'user', userId, 'stats'],
        queryFn: () => {
            if (!userId) throw new Error('User ID is required');
            return adminApi.getUserStats(userId);
        },
        enabled: !!userId,
    });
}

// Create user mutation
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserDto) => adminApi.createUser(data),
        onSuccess: () => {
            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

// Update user mutation
export function useUpdateUser(userId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateUserDto) => adminApi.updateUser(userId, data),
        onSuccess: (updatedUser) => {
            // Update cache for this user
            queryClient.setQueryData(['admin', 'user', userId], updatedUser);
            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

// Delete user mutation
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, hardDelete }: { userId: string; hardDelete?: boolean }) =>
            adminApi.deleteUser(userId, hardDelete),
        onSuccess: () => {
            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

// Reactivate user mutation
export function useReactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminApi.reactivateUser(userId),
        onSuccess: (_, userId) => {
            // Invalidate this user and users list
            queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}

// Reset password mutation
export function useResetPassword() {
    return useMutation({
        mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
            adminApi.resetPassword(userId, newPassword),
    });
}

// Bulk deactivate mutation
export function useBulkDeactivate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userIds: string[]) => adminApi.bulkDeactivateUsers(userIds),
        onSuccess: () => {
            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
}
