import { useMemo, useState } from 'react';
import Section from '../common/layout/Section';
import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
import { GroupCreateForm } from './GroupCreateForm';
import { GroupList } from './GroupList';
import { GroupMembersManager } from './GroupMembersManager';
import type { GroupContact } from 'shared-types';
import {
  useCreateGroup,
  useDeleteGroup,
  useGroupMembers,
  useGroups,
  useAddMembersToGroup,
  useRemoveMemberFromGroup,
} from '../../lib/groups/hooks';
import { useContacts } from '../../lib/contacts/hooks';

export function GroupsDashboard() {
  // You can replace this with a real company selector or session-derived value
  const companyId = 'cmeic3bb30000oh3wub0sckq3';

  const { data: groups = [], isLoading: loadingGroups } = useGroups(companyId);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const { data: contacts = [] } = useContacts(companyId);

  const { data: members = [] } = useGroupMembers(activeGroupId ?? '');

  const createGroupMutation = useCreateGroup();
  const deleteGroupMutation = useDeleteGroup(companyId);
  const addMembersMutation = useAddMembersToGroup(activeGroupId ?? '');
  const removeMemberMutation = useRemoveMemberFromGroup(activeGroupId ?? '');

  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId) || null, [groups, activeGroupId]);
  const activeMemberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const handleCreate = async (payload: { companyId: string; name: string; description?: string }) => {
    await createGroupMutation.mutateAsync(payload);
  };

  const handleDelete = async (groupId: string) => {
    await deleteGroupMutation.mutateAsync(groupId);
    if (activeGroupId === groupId) setActiveGroupId(null);
  };

  const addMembers = async (ids: string[]) => {
    if (!activeGroupId || ids.length === 0) return;
    await addMembersMutation.mutateAsync(ids);
  };

  const removeMember = async (id: string) => {
    if (!activeGroupId) return;
    await removeMemberMutation.mutateAsync(id);
  };

  // Derived stats
  const totalGroups = groups.length;
  const totalMembersSelected = members.length;

  return (
    <div className='mx-auto max-w-6xl p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h1 className='text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Groups</h1>
          <p className='text-sm text-neutral-600 dark:text-neutral-400'>Organize contacts into meaningful segments.</p>
        </div>
        {/* Quick stats */}
        <div className='inline-flex gap-2'>
          <span className='rounded-md border border-neutral-200 px-3 py-1 text-sm dark:border-neutral-800'>
            {totalGroups} group{totalGroups === 1 ? '' : 's'}
          </span>
          {activeGroup ? (
            <span className='rounded-md border border-neutral-200 px-3 py-1 text-sm dark:border-neutral-800'>
              {totalMembersSelected} member{totalMembersSelected === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>

      {/* Layout */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Left column: creation + selected group info */}
        <div className='md:col-span-1'>
          <GroupCreateForm
            defaultCompanyId={companyId}
            onCreate={handleCreate}
            loading={createGroupMutation.isPending}
          />

          <Card
            className='mt-6'
            title={activeGroup ? activeGroup.name : 'No group selected'}
            description={activeGroup ? activeGroup.description || '—' : 'Select a group to manage its members.'}
            footer={
              activeGroup ? (
                <div className='flex justify-end'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      const ok = window.confirm(
                        `Are you sure you want to delete "${activeGroup.name}"? This cannot be undone.`
                      );
                      if (ok) handleDelete(activeGroup.id);
                    }}
                  >
                    Delete group
                  </Button>
                </div>
              ) : undefined
            }
          >
            {activeGroup ? (
              <div className='text-sm text-neutral-600 dark:text-neutral-400'>Members: {totalMembersSelected}</div>
            ) : (
              <div className='text-sm text-neutral-600 dark:text-neutral-400'>Choose a group from the list.</div>
            )}
          </Card>
        </div>

        {/* Right column: list + manager */}
        <div className='md:col-span-2 space-y-6'>
          <GroupList groups={groups} onSelect={setActiveGroupId} onDelete={handleDelete} loading={loadingGroups} />

          {activeGroup ? (
            <Section title='Manage Members'>
              <GroupMembersManager
                groupName={activeGroup.name}
                allContacts={contacts as GroupContact[]}
                memberIds={Array.from(activeMemberIds)}
                onAddMembers={addMembers}
                onRemoveMember={removeMember}
              />
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
