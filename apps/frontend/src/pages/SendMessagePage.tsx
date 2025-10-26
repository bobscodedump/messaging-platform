import MessageWizard from '../components/messages/MessageWizard';
import MessageCsvImport from '../components/messages/MessageCsvImport';
import { useAuth } from '../lib/auth/auth-context';

export default function SendMessagePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className='mx-auto max-w-7xl p-4 sm:p-6 space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-neutral-900 dark:text-white'>Send Messages</h1>
        <p className='text-sm text-neutral-600 dark:text-neutral-400 mt-1'>
          Send individual messages or bulk import from CSV
        </p>
      </div>

      {/* CSV Import Section */}
      <MessageCsvImport companyId={user.companyId} userId={user.id} />

      {/* Individual Message Section */}
      <MessageWizard />
    </div>
  );
}
