import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UpdateUserDto } from 'shared-types';
import { getUserById, updateUser } from './api';

export function useUserProfile(userId?: string) {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => {
            if (!userId) throw new Error('Missing user id');
            return getUserById(userId);
        },
        enabled: !!userId,
        staleTime: 60000,
    });
}

export function useUpdateUser(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: UpdateUserDto) => {
            if (!userId) throw new Error('Missing user id');
            return updateUser(userId, payload);
        },
        onSuccess: (updatedUser) => {
            if (!userId) return;
            queryClient.setQueryData(['user', userId], updatedUser);
        },
    });
}
