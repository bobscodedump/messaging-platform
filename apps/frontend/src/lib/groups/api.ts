import { CreateGroupDto, Group, GroupContact } from 'shared-types';
import { del, delWithBody, get, isSuccess, post, put } from '../api/api-client';

export const getAllGroups = async (companyId: string) => {
    const res = await get<Group[]>(`/companies/${companyId}/groups`);
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to fetch groups');
    return res.data!;
};

export const getGroupById = async (groupId: string) => {
    const res = await get<Group>(`/groups/${groupId}`);
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to fetch group');
    return res.data!;
};

export const createGroup = async (dto: CreateGroupDto) => {
    const res = await post<Group>(`/groups`, dto);
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to create group');
    return res.data!;
};

export const updateGroup = async (
    groupId: string,
    data: Partial<Pick<Group, 'name' | 'description'>>
) => {
    const res = await put<Group>(`/groups/${groupId}`, data);
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to update group');
    return res.data!;
};

export const deleteGroup = async (groupId: string) => {
    const res = await del<unknown>(`/groups/${groupId}`);
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to delete group');
    return true;
};

export const getGroupMembers = async (groupId: string) => {
    // Backend returns groupMember with included contact; map to GroupContact[] if needed
    const res = await get<any[]>(`/groups/${groupId}/members`);
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to fetch group members');
    const data = res.data ?? [];
    if (Array.isArray(data) && data.length > 0 && 'contact' in data[0]) {
        return (data as Array<{ contact: GroupContact }>).map((m) => m.contact);
    }
    return data as GroupContact[];
};

export const addMembersToGroup = async (groupId: string, contactIds: string[]) => {
    const res = await post<unknown>(`/groups/${groupId}/members`, { contactIds });
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to add members');
    return true;
};

export const removeMemberFromGroup = async (groupId: string, contactId: string) => {
    const res = await delWithBody<unknown>(`/groups/${groupId}/members`, { contactId });
    if (!isSuccess(res)) throw new Error(res.message ?? 'Failed to remove member');
    return true;
};
