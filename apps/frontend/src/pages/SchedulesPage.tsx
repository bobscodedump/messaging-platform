import { useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import ScheduleCreateForm from '../components/schedules/ScheduleCreateForm';
import { ScheduleCsvImport } from '../components/schedules/ScheduleCsvImport';
import { SchedulesList } from '../components/schedules/SchedulesList';
import { useDeleteSchedule } from '../lib/schedules/hooks';
import { Button } from '../components/common/ui/Button';

type Tab = 'list' | 'create' | 'import';

export default function SchedulesPage() {
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  const deleteScheduleMutation = useDeleteSchedule(companyId);
  const [activeTab, setActiveTab] = useState<Tab>('list');

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduleMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      // Error handling is now done in the list component via toast/alert if needed,
      // but here we just catch the mutation error.
    }
  };

  return (
    <div className='mx-auto max-w-7xl p-4 sm:p-6'>
      <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-neutral-900 dark:text-white'>Schedules</h1>
          <p className='mt-1 text-sm text-neutral-600 dark:text-neutral-400'>Create and manage scheduled messages</p>
        </div>
        <div className='flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg'>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'list'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All Schedules
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'create'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'import'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Import CSV
          </button>
        </div>
      </div>

      <div className='space-y-8'>
        {activeTab === 'list' && <SchedulesList onDelete={handleDelete} />}

        {activeTab === 'create' && (
          <div className='max-w-3xl mx-auto'>
            <div className='mb-4'>
              <Button variant='ghost' onClick={() => setActiveTab('list')} leftIcon={<span>←</span>}>
                Back to list
              </Button>
            </div>
            <ScheduleCreateForm />
          </div>
        )}

        {activeTab === 'import' && (
          <div className='max-w-3xl mx-auto'>
            <div className='mb-4'>
              <Button variant='ghost' onClick={() => setActiveTab('list')} leftIcon={<span>←</span>}>
                Back to list
              </Button>
            </div>
            <ScheduleCsvImport companyId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
}
