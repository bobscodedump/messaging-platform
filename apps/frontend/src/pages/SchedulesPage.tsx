import { useAuth } from '../lib/auth/auth-context';
import ScheduleCreateForm from '../components/schedules/ScheduleCreateForm';
import { ScheduleCsvImport } from '../components/schedules/ScheduleCsvImport';
import { SchedulesList } from '../components/schedules/SchedulesList';
import { useDeleteSchedule } from '../lib/schedules/hooks';

export default function SchedulesPage() {
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  const deleteScheduleMutation = useDeleteSchedule(companyId);

  const handleDelete = async (id: string) => {
    try {
      await deleteScheduleMutation.mutateAsync(id);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule. Please try again.');
    }
  };

  return (
    <div className='mx-auto max-w-7xl p-4 sm:p-6'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-neutral-900 dark:text-white'>Schedules</h1>
        <p className='mt-1 text-sm text-neutral-600 dark:text-neutral-400'>
          Create and manage scheduled messages
        </p>
      </div>

      <div className='space-y-8'>
        {/* List of schedules */}
        <SchedulesList onDelete={handleDelete} />

        {/* CSV Import */}
        <ScheduleCsvImport companyId={companyId} />

        {/* Create Form */}
        <ScheduleCreateForm />
      </div>
    </div>
  );
}
