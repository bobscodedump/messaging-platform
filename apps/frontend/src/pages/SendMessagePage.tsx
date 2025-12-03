import { useState } from 'react';
import MessageWizard from '../components/messages/MessageWizard';
import MessageCsvImport from '../components/messages/MessageCsvImport';
import { useAuth } from '../lib/auth/auth-context';

type Tab = 'single' | 'bulk';

export default function SendMessagePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('single');

  if (!user) return null;

  return (
    <div className='mx-auto max-w-7xl p-4 sm:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-neutral-900 dark:text-white'>Send Messages</h1>
          <p className='text-sm text-neutral-600 dark:text-neutral-400 mt-1'>
            Send individual messages or bulk import from CSV
          </p>
        </div>
        <div className='flex gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg'>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'single'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Message Wizard
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bulk'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Bulk Import (CSV)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className='mt-6'>
        {activeTab === 'single' ? (
          <MessageWizard />
        ) : (
          <div className='max-w-3xl mx-auto'>
            <MessageCsvImport companyId={user.companyId} userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
