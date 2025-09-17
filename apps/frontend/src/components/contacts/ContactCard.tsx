import React, { useMemo, useState } from 'react';
import type { CreateContactDto } from 'shared-types';
import Card from '../common/layout/Card';
import Section from '../common/layout/Section';
import Button from '../common/ui/Button';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';

export type ContactCardProps = {
  contact: Partial<CreateContactDto> & { id?: string };
  className?: string;
  onSave?: (data: CreateContactDto) => void | Promise<void>;
  loading?: boolean;
  onDelete?: () => void;
  editingEnabled?: boolean;
};

function formatDate(value?: string | Date) {
  if (!value) return '';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function useFormState(initial?: Partial<CreateContactDto>) {
  const [values, setValues] = useState<Partial<CreateContactDto>>({
    companyId: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    birthDate: undefined,
    note: '',
    ...initial,
  });

  const set = <K extends keyof CreateContactDto>(key: K, value: CreateContactDto[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  return { values, set } as const;
}

function validate(values: Partial<CreateContactDto>) {
  const errors: Partial<Record<keyof CreateContactDto, string>> = {};
  if (!values.companyId) errors.companyId = 'Company is required';
  if (!values.firstName) errors.firstName = 'First name is required';
  if (!values.lastName) errors.lastName = 'Last name is required';
  if (!values.phoneNumber) errors.phoneNumber = 'Phone number is required';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Invalid email';
  return errors;
}

export function ContactCard({
  contact,
  className,
  onSave,
  loading,
  onDelete,
  editingEnabled = true,
}: ContactCardProps) {
  const { values, set } = useFormState({
    companyId: contact.companyId ?? '',
    firstName: contact.firstName ?? '',
    lastName: contact.lastName ?? '',
    phoneNumber: contact.phoneNumber ?? '',
    email: contact.email ?? '',
    address: contact.address ?? '',
    birthDate: contact.birthDate ?? undefined,
    note: contact.note ?? '',
  });

  console.log(contact);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const fullName = [values.firstName, values.lastName].filter(Boolean).join(' ') || 'Unnamed contact';
  const subTitle = [values.phoneNumber, values.email].filter(Boolean).join(' • ');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      companyId: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
    });
    if (!isValid || !onSave || !editingEnabled) return;

    const payload: CreateContactDto = {
      companyId: (values.companyId || '').trim(),
      firstName: (values.firstName || '').trim(),
      lastName: (values.lastName || '').trim(),
      phoneNumber: (values.phoneNumber || '').trim(),
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
      birthDate: values.birthDate ? new Date(values.birthDate) : undefined,
      note: values.note?.trim() || undefined,
    };

    await onSave(payload);
  };

  return (
    <form onSubmit={handleSave} className={['max-w-2xl mx-auto p-6', className ?? ''].join(' ')}>
      <Card
        title={
          <div>
            <div className='text-lg font-semibold text-neutral-900 dark:text-neutral-100'>{fullName}</div>
            {subTitle ? <div className='text-sm text-neutral-600 dark:text-neutral-400'>{subTitle}</div> : null}
          </div>
        }
        footer={
          <div className='flex items-center justify-end gap-3'>
            {onDelete ? (
              <Button type='button' variant='ghost' onClick={onDelete} aria-label='Delete contact'>
                Delete
              </Button>
            ) : null}
            <Button type='submit' variant='primary' loading={loading} disabled={!isValid || !editingEnabled}>
              Save changes
            </Button>
          </div>
        }
      >
        <Section title='Contact details'>
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
            <div className='space-y-1 opacity-60' aria-disabled>
              <div className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>Company ID</div>
              <div className='min-h-[2rem] rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-mono text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'>
                {values.companyId || <span className='text-neutral-400'>—</span>}
              </div>
            </div>

            <FormField
              label='Phone number'
              htmlFor='phoneNumber'
              required
              error={touched.phoneNumber ? errors.phoneNumber : undefined}
              editingEnabled={editingEnabled}
            >
              <Input
                id='phoneNumber'
                name='phoneNumber'
                placeholder='+1 555 555 5555'
                value={values.phoneNumber || ''}
                onChange={(e) => set('phoneNumber', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, phoneNumber: true }))}
                disabled={!editingEnabled}
              />
            </FormField>

            <FormField
              label='Email'
              htmlFor='email'
              error={touched.email ? errors.email : undefined}
              editingEnabled={editingEnabled}
            >
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='john@example.com'
                value={values.email || ''}
                onChange={(e) => set('email', e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                disabled={!editingEnabled}
              />
            </FormField>

            <FormField label='Birth date' htmlFor='birthDate' editingEnabled={editingEnabled}>
              <Input
                id='birthDate'
                name='birthDate'
                type='date'
                value={formatDate(values.birthDate as any)}
                onChange={(e) => set('birthDate', e.target.value ? new Date(e.target.value) : (undefined as any))}
                disabled={!editingEnabled}
              />
            </FormField>

            <FormField label='Address' htmlFor='address' editingEnabled={editingEnabled}>
              <Input
                id='address'
                name='address'
                placeholder='123 Main St, City, Country'
                value={values.address || ''}
                onChange={(e) => set('address', e.target.value)}
                disabled={!editingEnabled}
              />
            </FormField>

            <div className='sm:col-span-2'>
              <FormField label='Notes' htmlFor='note' editingEnabled={editingEnabled}>
                <Textarea
                  id='note'
                  name='note'
                  rows={4}
                  placeholder='Any additional details...'
                  value={values.note || ''}
                  onChange={(e) => set('note', e.target.value)}
                  disabled={!editingEnabled as any}
                />
              </FormField>
            </div>
          </div>
        </Section>
      </Card>
    </form>
  );
}
