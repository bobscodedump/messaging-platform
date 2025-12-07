import { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { useSchedules } from '../../lib/schedules/hooks';
import Card from '../common/layout/Card';
import ConfirmationModal from '../common/ui/ConfirmationModal';
import { Badge } from '../common/ui/Badge';
import { Alert } from '../common/ui/Alert';
import type { ScheduledMessageSummary } from 'shared-types';
import type { BadgeVariant } from '../common/ui/Badge';

type Tab = 'active' | 'past';

const scheduleTypeMeta: Record<ScheduledMessageSummary['scheduleType'], { label: string; variant: BadgeVariant }> = {
  ONE_TIME: { label: 'One-time', variant: 'info' },
  WEEKLY: { label: 'Weekly', variant: 'success' },
  MONTHLY: { label: 'Monthly', variant: 'primary' },
  YEARLY: { label: 'Yearly', variant: 'warning' },
  BIRTHDAY: { label: 'Birthday', variant: 'secondary' },
};

interface ScheduleRowProps {
  schedule: ScheduledMessageSummary;
  onDelete?: (id: string) => void;
}

function ScheduleRow({ schedule, onDelete }: ScheduleRowProps) {
  const isRecurring = ['WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(schedule.scheduleType);

  // Parse recurring pattern for display
  let recurringDisplay = '';
  if (isRecurring && schedule.recurringPattern) {
    try {
      const pattern = JSON.parse(schedule.recurringPattern);
      switch (schedule.scheduleType) {
        case 'WEEKLY':
          recurringDisplay = `Every ${pattern.day || '?'} at ${pattern.time || '09:00'}`;
          break;
        case 'MONTHLY':
          recurringDisplay = `Day ${pattern.day || '?'} of each month at ${pattern.time || '09:00'}`;
          break;
        case 'YEARLY':
          recurringDisplay = `${pattern.month || '?'}/${pattern.day || '?'} annually at ${pattern.time || '09:00'}`;
          break;
        case 'BIRTHDAY':
          recurringDisplay = `On contact birthdays at ${pattern.time || '09:00'}`;
          break;
      }
    } catch {
      recurringDisplay = 'Invalid pattern';
    }
  }

  const scheduledDisplay = schedule.scheduledAt ? new Date(schedule.scheduledAt).toLocaleString() : recurringDisplay;

  const lastExecuted = schedule.lastExecutedAt ? new Date(schedule.lastExecutedAt).toLocaleString() : 'Never';
  const typeMeta = scheduleTypeMeta[schedule.scheduleType] ?? {
    label: schedule.scheduleType,
    variant: 'muted' as BadgeVariant,
  };

  return (
    <tr className='border-t border-border hover:bg-muted/50'>
      <td className='px-4 py-3'>
        <div className='font-medium text-foreground'>{schedule.name}</div>
        <div className='text-xs text-muted-foreground mt-1 max-w-md truncate'>{schedule.content}</div>
      </td>
      <td className='px-4 py-3'>
        <Badge variant={typeMeta.variant}>{typeMeta.label}</Badge>
      </td>
      <td className='px-4 py-3 text-sm text-muted-foreground'>{scheduledDisplay}</td>
      <td className='px-4 py-3 text-sm text-muted-foreground'>{lastExecuted}</td>
      <td className='px-4 py-3'>
        <Badge variant={schedule.isActive ? 'success' : 'muted'}>{schedule.isActive ? 'Active' : 'Inactive'}</Badge>
      </td>
      <td className='px-4 py-3'>
        {onDelete && (
          <button onClick={() => onDelete(schedule.id)} className='text-sm text-destructive hover:text-destructive/80'>
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

interface Props {
  onDelete?: (id: string) => void;
}

export function SchedulesList({ onDelete }: Props) {
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [scheduleToDelete, setScheduleToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, error } = useSchedules(companyId, page, limit);
  const schedules = data?.schedules || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  // Reset to page 1 when changing tabs or page size
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleDeleteClick = (id: string) => {
    const schedule = schedules.find((s) => s.id === id);
    if (schedule) {
      setScheduleToDelete({ id: schedule.id, name: schedule.name });
    }
  };

  const handleConfirmDelete = () => {
    if (scheduleToDelete && onDelete) {
      onDelete(scheduleToDelete.id);
      setScheduleToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card title='Schedules' description='Loading schedules...'>
        <div className='flex items-center justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary' />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title='Schedules' description='Error loading schedules'>
        <div className='rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive'>
          {error instanceof Error ? error.message : 'Failed to load schedules'}
        </div>
      </Card>
    );
  }

  // Filter schedules based on tab
  const now = new Date();
  const activeSchedules =
    schedules?.filter((s) => {
      // Recurring schedules are always "active" unless manually deactivated
      if (['WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(s.scheduleType)) {
        return s.isActive;
      }
      // ONE_TIME schedules are active if not yet executed and in the future
      if (s.scheduleType === 'ONE_TIME' && s.scheduledAt) {
        return new Date(s.scheduledAt) > now && s.isActive;
      }
      return false;
    }) || [];

  const pastSchedules =
    schedules?.filter((s) => {
      // ONE_TIME schedules that have passed or been executed
      if (s.scheduleType === 'ONE_TIME' && s.scheduledAt) {
        return new Date(s.scheduledAt) <= now || !s.isActive;
      }
      // Recurring schedules that have been deactivated
      if (['WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(s.scheduleType)) {
        return !s.isActive;
      }
      return false;
    }) || [];

  const displaySchedules = activeTab === 'active' ? activeSchedules : pastSchedules;

  return (
    <Card title='Schedules' description='View and manage all your scheduled messages'>
      {/* Tabs */}
      <div className='border-b border-border mb-4'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => handleTabChange('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Active ({activeSchedules.length})
          </button>
          <button
            onClick={() => handleTabChange('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Past/Inactive ({pastSchedules.length})
          </button>
        </nav>
      </div>

      {/* Table */}
      {displaySchedules.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>
          <p className='text-sm'>
            {activeTab === 'active'
              ? 'No active schedules. Create one to get started!'
              : 'No past or inactive schedules.'}
          </p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead className='bg-muted/50'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Name & Content
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Type
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Schedule
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Last Executed
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displaySchedules.map((schedule) => (
                <ScheduleRow key={schedule.id} schedule={schedule} onDelete={handleDeleteClick} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className='mt-4 flex items-center justify-between border-t border-border pt-4'>
          <div className='flex items-center space-x-4'>
            <div className='text-sm text-muted-foreground'>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} schedules
            </div>
            <div className='flex items-center space-x-2'>
              <label htmlFor='page-size' className='text-sm text-muted-foreground'>
                Per page:
              </label>
              <select
                id='page-size'
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className='px-2 py-1 text-sm border border-input rounded-md bg-background text-foreground focus:border-ring focus:ring-ring'
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='px-3 py-1 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </button>
            <span className='text-sm text-muted-foreground'>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='px-3 py-1 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Recurring schedules info */}
      {activeTab === 'active' &&
        activeSchedules.some((s) => ['WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(s.scheduleType)) && (
          <Alert
            variant='info'
            title='Recurring Schedules'
            description='Weekly, Monthly, Yearly, and Birthday schedules keep running based on their pattern until you turn them off.'
            className='mt-4 text-xs'
          >
            <p className='text-xs text-foreground/70'>
              Check the “Last Executed” column to confirm the most recent run.
            </p>
          </Alert>
        )}

      <ConfirmationModal
        isOpen={!!scheduleToDelete}
        onClose={() => setScheduleToDelete(null)}
        onConfirm={handleConfirmDelete}
        title='Delete Schedule'
        message={`Are you sure you want to delete "${scheduleToDelete?.name}"?`}
        confirmLabel='Delete'
        isDestructive
      />
    </Card>
  );
}
