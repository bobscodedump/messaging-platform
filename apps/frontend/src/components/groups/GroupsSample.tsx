import { useMemo, useState } from 'react';
import { GroupCreateForm } from './GroupCreateForm';
import { GroupList } from './GroupList';
import { GroupMembersManager } from './GroupMembersManager';
import Section from '../common/layout/Section';
import type { Group, GroupContact } from 'shared-types';

const fakeContacts: GroupContact[] = [
  { id: 'c1', firstName: 'Alice', lastName: 'Smith', phoneNumber: '+1 555 0001' },
  { id: 'c2', firstName: 'Bob', lastName: 'Jones', phoneNumber: '+1 555 0002' },
  { id: 'c3', firstName: 'Charlie', lastName: 'Brown', phoneNumber: '+1 555 0003' },
  { id: 'c4', firstName: 'Diana', lastName: 'Prince', phoneNumber: '+1 555 0004' },
  { id: 'c5', firstName: 'Eve', lastName: 'Stone', phoneNumber: '+1 555 0005' },
];

export function GroupsSample() {
  const [groups, setGroups] = useState<Group[]>([
    { id: 'g1', name: 'VIP Customers', description: 'High value segment' },
    { id: 'g2', name: 'Newsletter', description: 'Weekly updates' },
  ]);

  const [groupMembers, setGroupMembers] = useState<Record<string, string[]>>({
    g1: ['c1', 'c2'],
    g2: ['c3'],
  });

  const [activeGroupId, setActiveGroupId] = useState<string | null>('g1');

  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId) || null, [groups, activeGroupId]);
  const activeMemberIds = useMemo(
    () => (activeGroupId ? (groupMembers[activeGroupId] ?? []) : []),
    [groupMembers, activeGroupId]
  );

  const handleCreate = async (payload: { companyId: string; name: string; description?: string }) => {
    const id = `g${groups.length + 1}`;
    setGroups((prev) => [...prev, { id, name: payload.name, description: payload.description }]);
    setGroupMembers((prev) => ({ ...prev, [id]: [] }));
    setActiveGroupId(id);
  };

  const handleDelete = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setGroupMembers((prev) => {
      const copy = { ...prev };
      delete copy[groupId];
      return copy;
    });
    if (activeGroupId === groupId) setActiveGroupId(null);
  };

  const addMembers = async (ids: string[]) => {
    if (!activeGroupId) return;
    setGroupMembers((prev) => {
      const current = new Set(prev[activeGroupId] ?? []);
      ids.forEach((id) => current.add(id));
      return { ...prev, [activeGroupId]: Array.from(current) };
    });
  };

  const removeMember = async (id: string) => {
    if (!activeGroupId) return;
    setGroupMembers((prev) => ({
      ...prev,
      [activeGroupId]: (prev[activeGroupId] ?? []).filter((x) => x !== id),
    }));
  };

  return (
    <div className='space-y-6'>
      <Section title='Groups'>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          <div className='md:col-span-1'>
            <GroupCreateForm onCreate={handleCreate} />
          </div>
          <div className='md:col-span-2'>
            <GroupList groups={groups} onSelect={setActiveGroupId} onDelete={handleDelete} />
          </div>
        </div>
      </Section>

      {activeGroup ? (
        <Section title='Manage Members'>
          <GroupMembersManager
            groupName={activeGroup.name}
            allContacts={fakeContacts}
            memberIds={activeMemberIds}
            onAddMembers={addMembers}
            onRemoveMember={removeMember}
          />
        </Section>
      ) : null}
    </div>
  );
}
