import { useMemo, useState } from 'react';
import { useContacts } from '../contacts/hooks';
import { useGroups, groupMembersQueryOptions } from '../groups/hooks';
import type { Contact } from 'shared-types';
import { useQueries, useMutation } from '@tanstack/react-query';
import { sendMessage as sendMessageApi, importMessagesCsv } from './api';

export function useMessageRecipients(companyId: string) {
    const { data: contacts = [], isLoading: loadingContacts } = useContacts(companyId);
    const { data: groups = [], isLoading: loadingGroups } = useGroups(companyId);

    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

    const toggleContact = (id: string) => {
        setSelectedContactIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleGroup = (id: string) => {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectedGroups = useMemo(() => groups.filter((g) => selectedGroupIds.has(g.id)), [groups, selectedGroupIds]);

    const groupMembersQueries = useQueries({
        queries: selectedGroups.map((g) => groupMembersQueryOptions(g.id)),
    });

    const uniqueRecipientIds = useMemo(() => {
        const ids = new Set(selectedContactIds);
        groupMembersQueries.forEach((query) => {
            if (query.data) {
                query.data.forEach((member) => ids.add(member.id));
            }
        });
        return ids;
    }, [selectedContactIds, groupMembersQueries]);

    const allKnownContacts = useMemo(() => {
        const contactMap = new Map<string, Contact>();
        contacts.forEach((c) => contactMap.set(c.id, c));
        groupMembersQueries.forEach((q) => {
            if (q.data) {
                q.data.forEach((m) => contactMap.set(m.id, m as Contact));
            }
        });
        return Array.from(contactMap.values());
    }, [contacts, groupMembersQueries]);

    const recipientContacts = useMemo(() => {
        return allKnownContacts.filter((c) => uniqueRecipientIds.has(c.id));
    }, [allKnownContacts, uniqueRecipientIds]);

    return {
        contacts,
        groups,
        loading: loadingContacts || loadingGroups,
        selectedContactIds,
        selectedGroupIds,
        toggleContact,
        toggleGroup,
        recipientCount: uniqueRecipientIds.size,
        recipientContacts,
    };
}

export function useSendMessage() {
    return useMutation({
        mutationFn: sendMessageApi,
    });
}

export function useImportMessages(companyId: string, userId: string, templateId: string) {
    return useMutation({
        mutationFn: (file: File) => importMessagesCsv(companyId, userId, templateId, file),
    });
}
