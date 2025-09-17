import { useEffect, useMemo, useState } from 'react';
import Card from '../common/layout/Card';
import Input from '../common/ui/Input';
import Button from '../common/ui/Button';
import FormField from '../common/ui/FormField';
import type { GroupContact } from 'shared-types';

export type GroupMembersManagerProps = {
  groupName: string;
  allContacts: GroupContact[];
  memberIds: string[];
  onAddMembers: (ids: string[]) => Promise<void> | void;
  onRemoveMember: (id: string) => Promise<void> | void;
};

export function GroupMembersManager({
  groupName,
  allContacts,
  memberIds,
  onAddMembers,
  onRemoveMember,
}: GroupMembersManagerProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  // Pagination state
  const PAGE_SIZE = 6;
  const [searchPage, setSearchPage] = useState(1);
  const [membersPage, setMembersPage] = useState(1);

  const members = useMemo(() => allContacts.filter((c) => memberIds.includes(c.id)), [allContacts, memberIds]);
  const nonMembers = useMemo(() => allContacts.filter((c) => !memberIds.includes(c.id)), [allContacts, memberIds]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nonMembers;
    return nonMembers.filter((c) => [c.firstName, c.lastName, c.phoneNumber].join(' ').toLowerCase().includes(q));
  }, [nonMembers, query]);

  // Reset/clamp pages when data changes
  const filteredTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const membersTotalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));

  useEffect(() => {
    setSearchPage(1);
  }, [query]);

  useEffect(() => {
    setSearchPage((p) => Math.min(Math.max(1, p), filteredTotalPages));
  }, [filteredTotalPages]);

  useEffect(() => {
    setMembersPage((p) => Math.min(Math.max(1, p), membersTotalPages));
  }, [membersTotalPages]);

  const filteredPageItems = useMemo(() => {
    const start = (searchPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, searchPage]);

  const membersPageItems = useMemo(() => {
    const start = (membersPage - 1) * PAGE_SIZE;
    return members.slice(start, start + PAGE_SIZE);
  }, [members, membersPage]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addSelected = async () => {
    if (selected.length === 0) return;
    await onAddMembers(selected);
    setSelected([]);
    setQuery('');
  };

  const RangeInfo = ({ total, page }: { total: number; page: number }) => {
    if (total === 0) return <span className='text-xs text-neutral-500'>0 of 0</span>;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(total, page * PAGE_SIZE);
    return (
      <span className='text-xs text-neutral-500'>
        {start}–{end} of {total}
      </span>
    );
  };

  return (
    <Card title={`Manage Members — ${groupName}`} description='Search and add contacts to this group.'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Search & Add */}
        <div>
          <FormField label='Search contacts' htmlFor='group-search' helpText='Type a name or phone number'>
            <Input
              id='group-search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search name or phone…'
            />
          </FormField>
          <div className='mt-3 max-h-64 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800'>
            {filtered.length === 0 ? (
              <div className='p-3 text-sm text-neutral-500'>No contacts found</div>
            ) : (
              <ul className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                {filteredPageItems.map((c) => (
                  <li key={c.id} className='flex items-center justify-between gap-3 p-2'>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium text-neutral-900 dark:text-neutral-100'>
                        {c.firstName} {c.lastName}
                      </div>
                      <div className='truncate text-xs text-neutral-500'>{c.phoneNumber}</div>
                    </div>
                    <label className='inline-flex items-center gap-2 text-sm'>
                      <input
                        type='checkbox'
                        checked={selected.includes(c.id)}
                        onChange={() => toggle(c.id)}
                        className='h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 dark:border-neutral-700'
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Pagination Controls for Search */}
          <div className='mt-3 flex items-center justify-between'>
            <RangeInfo total={filtered.length} page={searchPage} />
            <div className='inline-flex items-center gap-2'>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                disabled={searchPage <= 1}
              >
                Prev
              </Button>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setSearchPage((p) => Math.min(filteredTotalPages, p + 1))}
                disabled={searchPage >= filteredTotalPages}
              >
                Next
              </Button>
            </div>
          </div>
          <div className='mt-3 flex justify-end'>
            <Button size='sm' onClick={addSelected} disabled={selected.length === 0}>
              Add Selected
            </Button>
          </div>
        </div>

        {/* Current Members */}
        <div>
          <div className='mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
            Current members
          </div>
          <div className='max-h-80 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800'>
            {members.length === 0 ? (
              <div className='p-3 text-sm text-neutral-500'>No members yet</div>
            ) : (
              <ul className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                {membersPageItems.map((c) => (
                  <li key={c.id} className='flex items-center justify-between gap-3 p-2'>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium text-neutral-900 dark:text-neutral-100'>
                        {c.firstName} {c.lastName}
                      </div>
                      <div className='truncate text-xs text-neutral-500'>{c.phoneNumber}</div>
                    </div>
                    <Button variant='secondary' size='sm' onClick={() => onRemoveMember(c.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Pagination Controls for Members */}
          <div className='mt-3 flex items-center justify-between'>
            <RangeInfo total={members.length} page={membersPage} />
            <div className='inline-flex items-center gap-2'>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setMembersPage((p) => Math.max(1, p - 1))}
                disabled={membersPage <= 1}
              >
                Prev
              </Button>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => setMembersPage((p) => Math.min(membersTotalPages, p + 1))}
                disabled={membersPage >= membersTotalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
