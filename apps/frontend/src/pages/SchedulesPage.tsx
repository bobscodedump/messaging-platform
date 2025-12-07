import { useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import ScheduleCreateForm from '../components/schedules/ScheduleCreateForm';
import { ScheduleCsvImport } from '../components/schedules/ScheduleCsvImport';
import { SchedulesList } from '../components/schedules/SchedulesList';
import { useDeleteSchedule } from '../lib/schedules/hooks';
import Button from '../components/common/ui/Button';

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
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Schedules</h1>
          <p className='mt-1 text-sm text-muted-foreground'>Create and manage scheduled messages</p>
        </div>
        <div className='flex gap-2 rounded-lg bg-muted p-1'>
          <button
            onClick={() => setActiveTab('list')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            All Schedules
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            Import CSV
          </button>
        </div>
      </div>

      <div className='space-y-8'>
        {activeTab === 'list' && <SchedulesList onDelete={handleDelete} />}

        {activeTab === 'create' && (
          <div className='mx-auto max-w-3xl'>
            <div className='mb-4'>
              <Button variant='ghost' onClick={() => setActiveTab('list')}>
                ← Back to list
              </Button>
            </div>
            <ScheduleCreateForm />
          </div>
        )}

        {activeTab === 'import' && (
          <div className='mx-auto max-w-3xl'>
            <div className='mb-4'>
              <Button variant='ghost' onClick={() => setActiveTab('list')}>
                ← Back to list
              </Button>
            </div>
            <ScheduleCsvImport companyId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
}
