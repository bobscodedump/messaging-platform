import { UpdateUserDto, User } from 'shared-types';
import { get, isSuccess, put } from '../api/api-client';

export const getUserById = async (userId: string) => {
    const response = await get<User>(`/users/${userId}`);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to fetch user details');
    }
    return response.data!;
};

export const updateUser = async (userId: string, data: UpdateUserDto) => {
    const response = await put<User>(`/users/${userId}`, data);
    if (!isSuccess(response)) {
        throw new Error(response.message ?? 'Failed to update user');
    }
    return response.data!;
};
