import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContact, deleteContact, getAllContacts } from './api';
import type { Contact, CreateContactDto } from 'shared-types';

export function useContacts(companyId: string) {
    return useQuery<Contact[], Error>({
        queryKey: ['contacts', companyId],
        queryFn: () => getAllContacts(companyId),
        enabled: !!companyId,
        staleTime: 60000,
    });
}

export function useCreateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateContactDto) => createContact(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['contacts', data.companyId] });
        },
    });
}

export function useDeleteContact(companyId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteContact(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts', companyId] });
        },
    });
}
