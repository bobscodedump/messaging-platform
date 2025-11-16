import { get, post, put, del, isSuccess } from '../api/api-client';

export interface AdminUser {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT' | 'COMPANY_ADMIN' | 'COMPANY_SUPPORT';
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
    company: {
        id: string;
        name: string;
    };
    _count?: {
        messages: number;
        scheduledMessages: number;
        auditLogs: number;
    };
}

export interface UserFilters {
    companyId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

export interface CreateUserDto {
    companyId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT' | 'COMPANY_ADMIN' | 'COMPANY_SUPPORT';
}

export interface UpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT' | 'COMPANY_ADMIN' | 'COMPANY_SUPPORT';
    isActive?: boolean;
    password?: string;
}

export interface UserStats {
    userId: string;
    messagesSent: number;
    schedulesCreated: number;
    lastLoginAt: string | null;
    recentActivity: Array<{
        id: string;
        action: string;
        resourceType: string | null;
        createdAt: string;
    }>;
}

// Get all users with pagination and filters
export const getAllUsers = async (filters: UserFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    const response = await get<{
        users: AdminUser[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(`/admin/users?${params.toString()}`);

    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to fetch users');
    }
    return response.data!;
};

// Get user by ID
export const getUserById = async (userId: string) => {
    const response = await get<AdminUser>(`/admin/users/${userId}`);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to fetch user');
    }
    return response.data!;
};

// Create new user
export const createUser = async (data: CreateUserDto) => {
    const response = await post<AdminUser>('/admin/users', data);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to create user');
    }
    return response.data!;
};

// Update user
export const updateUser = async (userId: string, data: UpdateUserDto) => {
    const response = await put<AdminUser>(`/admin/users/${userId}`, data);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to update user');
    }
    return response.data!;
};

// Delete user (soft or hard delete)
export const deleteUser = async (userId: string, hardDelete = false) => {
    const params = hardDelete ? '?hardDelete=true' : '';
    const response = await del<{ success: boolean; hardDelete: boolean }>(
        `/admin/users/${userId}${params}`
    );
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to delete user');
    }
    return response.data!;
};

// Reactivate user
export const reactivateUser = async (userId: string) => {
    const response = await post<AdminUser>(`/admin/users/${userId}/reactivate`, {});
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to reactivate user');
    }
    return response.data!;
};

// Reset user password
export const resetPassword = async (userId: string, newPassword: string) => {
    const response = await post<{ success: boolean }>(`/admin/users/${userId}/reset-password`, {
        newPassword,
    });
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to reset password');
    }
    return response.data!;
};

// Get user stats
export const getUserStats = async (userId: string) => {
    const response = await get<UserStats>(`/admin/users/${userId}/stats`);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to fetch user stats');
    }
    return response.data!;
};

// Bulk deactivate users
export const bulkDeactivateUsers = async (userIds: string[]) => {
    const response = await post<{ success: boolean; count: number }>('/admin/users/bulk-deactivate', {
        userIds,
    });
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to bulk deactivate users');
    }
    return response.data!;
};
