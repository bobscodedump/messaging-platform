import { useState } from 'react';
import type { CreateContactDto } from 'shared-types';
import { ContactDashboard } from '../components/contacts/ContactDashboard';
import { ContactCreateForm } from '../components/contacts/ContactCreateForm';
import ContactsCsvImport from '../components/contacts/ContactsCsvImport';
import Button from '../components/common/ui/Button';
import { Badge } from '../components/common/ui/Badge';
import { useAuth } from '../lib/auth/auth-context';
import { useCreateContact } from '../lib/contacts/hooks';

type Tab = 'list' | 'create' | 'import';

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const { user } = useAuth();
  const companyId = user?.companyId || '';
  const createContactMutation = useCreateContact();

  const handleCreateContact = async (data: CreateContactDto) => {
    await createContactMutation.mutateAsync(data);
    setActiveTab('list');
  };

  return (
    <div className='mx-auto max-w-7xl p-4 sm:p-6'>
      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
            <Badge variant='muted' size='sm'>
              Workspace data
            </Badge>
            <span>Contacts</span>
          </div>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Contact directory</h1>
            <p className='mt-1 text-sm text-muted-foreground'>Create, import, and manage every record in one place.</p>
          </div>
        </div>

        <div className='flex gap-2 rounded-lg bg-muted p-1 text-sm font-medium shadow-inner'>
          {[
            { key: 'list', label: 'All Contacts' },
            { key: 'create', label: 'Create New' },
            { key: 'import', label: 'Import CSV' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              className={`rounded-md px-4 py-2 transition-colors ${
                activeTab === tab.key
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-8'>
        {activeTab === 'list' && <ContactDashboard />}

        {activeTab === 'create' && (
          <div className='mx-auto max-w-3xl space-y-4'>
            <Button variant='ghost' onClick={() => setActiveTab('list')} className='w-max'>
              ← Back to list
            </Button>
            <ContactCreateForm onCreate={handleCreateContact} loading={createContactMutation.isPending} />
          </div>
        )}

        {activeTab === 'import' && (
          <div className='mx-auto max-w-3xl space-y-4'>
            <Button variant='ghost' onClick={() => setActiveTab('list')} className='w-max'>
              ← Back to list
            </Button>
            <ContactsCsvImport companyId={companyId} />
          </div>
        )}
      </div>
    </div>
  );
}
