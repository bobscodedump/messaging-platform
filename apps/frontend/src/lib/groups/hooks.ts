import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { CreateGroupDto, Group, GroupContact } from 'shared-types';
import {
    addMembersToGroup,
    createGroup,
    deleteGroup,
    getAllGroups,
    getGroupById,
    getGroupMembers,
    removeMemberFromGroup,
    updateGroup,
} from './api';

export function useGroups(companyId: string) {
    return useQuery<Group[], Error>({
        queryKey: ['groups', companyId],
        queryFn: () => getAllGroups(companyId),
        enabled: !!companyId,
        staleTime: 60000,
    });
}

export function useGroup(groupId: string) {
    return useQuery<Group, Error>({
        queryKey: ['group', groupId],
        queryFn: () => getGroupById(groupId),
        enabled: !!groupId,
        staleTime: 60000,
    });
}

export function useCreateGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateGroupDto) => createGroup(dto),
        onSuccess: (_data, variables) => {
            // invalidate groups for that company
            qc.invalidateQueries({ queryKey: ['groups', variables.companyId] });
        },
    });
}

export function useUpdateGroup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ groupId, data }: { groupId: string; data: Partial<Pick<Group, 'name' | 'description'>> }) =>
            updateGroup(groupId, data),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['group', data.id] });
            qc.invalidateQueries({ queryKey: ['groups'] });
        },
    });
}

export function useDeleteGroup(companyId?: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => deleteGroup(groupId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groups', companyId] });
        },
    });
}

export function groupMembersQueryOptions(groupId: string): UseQueryOptions<GroupContact[], Error> {
    return {
        queryKey: ['group-members', groupId],
        queryFn: () => getGroupMembers(groupId),
        enabled: !!groupId,
        staleTime: 30000,
    };
}

export function useGroupMembers(groupId: string) {
    return useQuery<GroupContact[], Error>(groupMembersQueryOptions(groupId));
}

export function useAddMembersToGroup(groupId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (contactIds: string[]) => addMembersToGroup(groupId, contactIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['group-members', groupId] });
        },
    });
}

export function useRemoveMemberFromGroup(groupId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (contactId: string) => removeMemberFromGroup(groupId, contactId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['group-members', groupId] });
        },
    });
}
