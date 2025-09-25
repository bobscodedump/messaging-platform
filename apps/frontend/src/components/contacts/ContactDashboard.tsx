import { useState } from 'react';
import type { CreateContactDto, Contact } from 'shared-types';
import ContactList, { ContactListItem } from './ContactList';
import { ContactCard } from './ContactCard';
import { useContacts, useCreateContact, useDeleteContact } from '../../lib/contacts/hooks';
import ContactsCsvImport from './ContactsCsvImport';
import { ContactCreateForm } from './ContactCreateForm';
import { Button } from '../common/ui/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export function ContactDashboard() {
  const [page, setPage] = useState(1);
  const pageSize = 50; // backend currently returns all; pagination placeholder
  const companyId = 'cmeic3bb30000oh3wub0sckq3'; // TODO: derive from auth/session or UI state

  const { data: contacts = [], isLoading, error } = useContacts(companyId);
  const createContactMutation = useCreateContact();
  const deleteContactMutation = useDeleteContact(companyId);

  const [selected, setSelected] = useState<ContactListItem | null>(null);

  const handleCreateContact = async (data: CreateContactDto) => {
    await createContactMutation.mutateAsync(data);
  };

  const handleDelete = async (c: ContactListItem) => {
    if (!c.id) return;
    const ok = window.confirm(`Delete contact "${[c.firstName, c.lastName].filter(Boolean).join(' ') || c.id}"?`);
    if (!ok) return;
    try {
      await deleteContactMutation.mutateAsync(c.id);
    } catch (e: any) {
      alert(e.message || 'Failed to delete contact');
    }
  };

  if (selected) {
    return (
      <div className='mx-auto max-w-4xl p-6 space-y-4'>
        <Button variant='ghost' onClick={() => setSelected(null)} leftIcon={<ArrowBackIcon />}>
          Back to contacts
        </Button>
        <ContactCard
          contact={selected as CreateContactDto}
          editingEnabled={false}
          onSave={async () => {}}
          onDelete={async () => {
            if (!selected?.id) return;
            const ok = window.confirm(
              `Delete contact "${[selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.id}"?`
            );
            if (!ok) return;
            try {
              await deleteContactMutation.mutateAsync(selected.id);
              setSelected(null);
            } catch (e: any) {
              alert(e.message || 'Failed to delete contact');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-4xl p-6 space-y-4'>
      <h1 className='text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Contacts</h1>
      <ContactCreateForm
        onCreate={handleCreateContact}
        loading={createContactMutation.isPending}
        defaultCompanyId={companyId}
      />
  <ContactsCsvImport companyId={companyId} />
      {error ? (
        <div className='rounded-md border border-red-300 bg-red-50 p-3 text-red-700'>
          Failed to load contacts: {error.message}
        </div>
      ) : null}
      <ContactList
        contacts={(contacts as Contact[]).map((c) => ({
          id: c.id,
          companyId: c.companyId,
          firstName: c.firstName,
          lastName: c.lastName,
          phoneNumber: c.phoneNumber,
          email: c.email,
          address: c.address,
          birthDate: c.birthDate as any,
          note: c.note,
        }))}
        page={page}
        pageSize={pageSize}
        total={contacts.length}
        loading={isLoading}
        onPageChange={setPage}
        onSelect={(c) => setSelected(c)}
        onDelete={handleDelete}
      />
    </div>
  );
}
