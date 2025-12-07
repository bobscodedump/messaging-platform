import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
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
    <Card title='Groups' description='Browse and manage your groups.'>
      {loading ? (
        <div className='py-8 text-center text-sm text-muted-foreground'>Loading…</div>
      ) : (
        <ul className='divide-y divide-border'>
          {groups.length === 0 ? (
            <li className='py-8 text-center text-sm text-muted-foreground'>No groups yet</li>
          ) : (
            groups.map((g) => (
              <li
                key={g.id}
                className='flex items-center justify-between gap-3 py-3 hover:bg-muted/50 transition-colors px-2 -mx-2 rounded-md'
              >
                <button className='flex-1 text-left' onClick={() => onSelect?.(g.id)} title='Open group'>
                  <div className='font-medium text-foreground'>{g.name}</div>
                  <div className='text-xs text-muted-foreground'>{g.description || '—'}</div>
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
    </Card>
  );
}
