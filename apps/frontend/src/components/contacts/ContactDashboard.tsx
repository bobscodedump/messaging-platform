import { useState } from 'react';
import type { CreateContactDto, Contact } from 'shared-types';
import ContactList, { ContactListItem } from './ContactList';
import { ContactCard } from './ContactCard';
import { useContacts, useDeleteContact } from '../../lib/contacts/hooks';
import Button from '../common/ui/Button';
import ConfirmationModal from '../common/ui/ConfirmationModal';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../lib/auth/auth-context';

export function ContactDashboard() {
  const [page, setPage] = useState(1);
  const pageSize = 50; // backend currently returns all; pagination placeholder
  const { user } = useAuth();
  const companyId = user!.companyId;

  const { data: contacts = [], isLoading, error } = useContacts(companyId);
  const deleteContactMutation = useDeleteContact(companyId);

  const [selected, setSelected] = useState<ContactListItem | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ContactListItem | null>(null);

  const handleDeleteClick = (c: ContactListItem) => {
    setContactToDelete(c);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete?.id) return;
    try {
      await deleteContactMutation.mutateAsync(contactToDelete.id);
      setContactToDelete(null);
      if (selected?.id === contactToDelete.id) {
        setSelected(null);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete contact');
    }
  };

  if (selected) {
    return (
      <div className='mx-auto max-w-5xl p-6 space-y-6'>
        <Button variant='ghost' onClick={() => setSelected(null)} leftIcon={<ArrowBackIcon />}>
          Back to contacts
        </Button>
        <ContactCard
          contact={selected as CreateContactDto}
          editingEnabled={false}
          onSave={async () => {}}
          onDelete={async () => {
            if (!selected?.id) return;
            setContactToDelete(selected);
          }}
        />
        <ConfirmationModal
          isOpen={!!contactToDelete}
          onClose={() => setContactToDelete(null)}
          onConfirm={handleConfirmDelete}
          title='Delete Contact'
          message={`Are you sure you want to delete "${[contactToDelete?.firstName, contactToDelete?.lastName].filter(Boolean).join(' ') || contactToDelete?.id}"? This action cannot be undone.`}
          confirmLabel='Delete'
          isDestructive
          isLoading={deleteContactMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold text-foreground'>Contacts</h1>
      </div>

      {error ? (
        <div className='rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive'>
          Failed to load contacts: {error.message}
        </div>
      ) : null}

      <div className='bg-card rounded-lg border border-border shadow-sm overflow-hidden'>
        <div className='px-6 py-4 border-b border-border'>
          <h2 className='text-lg font-medium text-card-foreground'>All Contacts</h2>
        </div>
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
          onDelete={handleDeleteClick}
        />
      </div>

      <ConfirmationModal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        onConfirm={handleConfirmDelete}
        title='Delete Contact'
        message={`Are you sure you want to delete "${[contactToDelete?.firstName, contactToDelete?.lastName].filter(Boolean).join(' ') || contactToDelete?.id}"? This action cannot be undone.`}
        confirmLabel='Delete'
        isDestructive
        isLoading={deleteContactMutation.isPending}
      />
    </div>
  );
}
