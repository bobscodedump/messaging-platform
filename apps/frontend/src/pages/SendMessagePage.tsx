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
    <div className='mx-auto max-w-7xl space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>Send Messages</h1>
          <p className='mt-1 text-sm text-muted-foreground'>Send individual messages or bulk import from CSV</p>
        </div>
        <div className='flex gap-2 rounded-lg bg-muted p-1'>
          <button
            onClick={() => setActiveTab('single')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            }`}
          >
            Message Wizard
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'bulk'
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
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
          <div className='mx-auto max-w-3xl'>
            <MessageCsvImport companyId={user.companyId} userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
