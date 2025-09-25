import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../common/layout/Card';
import { Button } from '../common/ui/Button';
import type { Group } from 'shared-types';

export type GroupListProps = {
  groups: Group[];
  onSelect?: (groupId: string) => void;
  onDelete?: (groupId: string) => void;
  loading?: boolean;
};

export function GroupList({ groups, onSelect, onDelete, loading }: GroupListProps) {
  const confirmAndDelete = (id: string, name: string) => {
    const ok = window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`);
    if (ok) onDelete?.(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>Browse and manage your groups.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className='py-8 text-center text-sm text-neutral-500'>Loading…</div>
        ) : (
          <ul className='divide-y divide-neutral-200 dark:divide-neutral-800'>
            {groups.length === 0 ? (
              <li className='py-8 text-center text-sm text-neutral-500'>No groups yet</li>
            ) : (
              groups.map((g) => (
                <li key={g.id} className='flex items-center justify-between gap-3 py-3'>
                  <button className='flex-1 text-left' onClick={() => onSelect?.(g.id)} title='Open group'>
                    <div className='font-medium text-neutral-900 dark:text-neutral-100'>{g.name}</div>
                    <div className='text-xs text-neutral-500'>{g.description || '—'}</div>
                  </button>
                  <div className='shrink-0'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => confirmAndDelete(g.id, g.name)}
                      aria-label={`Delete ${g.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
