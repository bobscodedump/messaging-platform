import { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import { useSchedules } from '../../lib/schedules/hooks';
import Card from '../common/layout/Card';
import type { ScheduledMessageSummary } from 'shared-types';

type Tab = 'active' | 'past';

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

  return (
    <tr className='border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900'>
      <td className='px-4 py-3'>
        <div className='font-medium text-neutral-900 dark:text-white'>{schedule.name}</div>
        <div className='text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md truncate'>{schedule.content}</div>
      </td>
      <td className='px-4 py-3'>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            schedule.scheduleType === 'ONE_TIME'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : schedule.scheduleType === 'WEEKLY'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : schedule.scheduleType === 'MONTHLY'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : schedule.scheduleType === 'YEARLY'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    : 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
          }`}
        >
          {schedule.scheduleType}
        </span>
      </td>
      <td className='px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400'>{scheduledDisplay}</td>
      <td className='px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400'>{lastExecuted}</td>
      <td className='px-4 py-3'>
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            schedule.isActive
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
          }`}
        >
          {schedule.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className='px-4 py-3'>
        {onDelete && (
          <button
            onClick={() => {
              if (confirm(`Delete schedule "${schedule.name}"?`)) {
                onDelete(schedule.id);
              }
            }}
            className='text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
          >
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
  const { data: schedules, isLoading, error } = useSchedules(companyId);
  const [activeTab, setActiveTab] = useState<Tab>('active');

  if (isLoading) {
    return (
      <Card title='Schedules' description='Loading schedules...'>
        <div className='flex items-center justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-indigo-600' />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title='Schedules' description='Error loading schedules'>
        <div className='rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700'>
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
      <div className='border-b border-neutral-200 dark:border-neutral-800 mb-4'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            Active ({activeSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            Past/Inactive ({pastSchedules.length})
          </button>
        </nav>
      </div>

      {/* Table */}
      {displaySchedules.length === 0 ? (
        <div className='text-center py-12 text-neutral-500 dark:text-neutral-400'>
          <p className='text-sm'>
            {activeTab === 'active'
              ? 'No active schedules. Create one to get started!'
              : 'No past or inactive schedules.'}
          </p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead className='bg-neutral-50 dark:bg-neutral-800'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                  Name & Content
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                  Type
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                  Schedule
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                  Last Executed
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displaySchedules.map((schedule) => (
                <ScheduleRow key={schedule.id} schedule={schedule} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recurring schedules info */}
      {activeTab === 'active' &&
        activeSchedules.some((s) => ['WEEKLY', 'MONTHLY', 'YEARLY', 'BIRTHDAY'].includes(s.scheduleType)) && (
          <div className='mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300'>
            <p className='font-medium'>ℹ️ About Recurring Schedules</p>
            <p className='mt-1'>
              Recurring schedules (Weekly, Monthly, Yearly, Birthday) will continue to execute based on their pattern
              until you deactivate them. The "Last Executed" column shows when the schedule last ran.
            </p>
          </div>
        )}
    </Card>
  );
}
