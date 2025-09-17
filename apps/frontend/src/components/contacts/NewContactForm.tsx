import React, { useMemo, useState } from 'react';
import type { CreateContactDto } from 'shared-types';
import Card from '../common/layout/Card';
import Section from '../common/layout/Section';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import Button from '../common/ui/Button';

export type NewContactFormProps = {
  initial?: Partial<CreateContactDto>;
  onSubmit: (data: CreateContactDto) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  companyId?: string; // If provided, hide field
};

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

export function NewContactForm({ initial, onSubmit, onCancel, loading, companyId }: NewContactFormProps) {
  const { values, set } = useFormState({ ...initial, companyId: companyId ?? initial?.companyId });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => validate(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      companyId: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      email: true,
    });
    if (!isValid) return;

    const payload: CreateContactDto = {
      companyId: ((companyId ?? values.companyId) || '').trim(),
      firstName: (values.firstName || '').trim(),
      lastName: (values.lastName || '').trim(),
      phoneNumber: (values.phoneNumber || '').trim(),
      email: values.email?.trim() || undefined,
      address: values.address?.trim() || undefined,
      birthDate: values.birthDate ? new Date(values.birthDate) : undefined,
      note: values.note?.trim() || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <div className='mx-auto max-w-2xl p-6'>
      <Card title='New Contact' description='Add a new contact to your company directory.'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <Section>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              {!companyId && (
                <FormField
                  label='Company ID'
                  htmlFor='companyId'
                  required
                  error={touched.companyId ? errors.companyId : undefined}
                >
                  <Input
                    id='companyId'
                    name='companyId'
                    placeholder='cmp_1234'
                    value={values.companyId || ''}
                    onChange={(e) => set('companyId', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, companyId: true }))}
                  />
                </FormField>
              )}

              <FormField
                label='First name'
                htmlFor='firstName'
                required
                error={touched.firstName ? errors.firstName : undefined}
              >
                <Input
                  id='firstName'
                  name='firstName'
                  autoComplete='given-name'
                  placeholder='John'
                  value={values.firstName || ''}
                  onChange={(e) => set('firstName', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                />
              </FormField>

              <FormField
                label='Last name'
                htmlFor='lastName'
                required
                error={touched.lastName ? errors.lastName : undefined}
              >
                <Input
                  id='lastName'
                  name='lastName'
                  autoComplete='family-name'
                  placeholder='Doe'
                  value={values.lastName || ''}
                  onChange={(e) => set('lastName', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                />
              </FormField>

              <FormField
                label='Phone number'
                htmlFor='phoneNumber'
                required
                error={touched.phoneNumber ? errors.phoneNumber : undefined}
              >
                <Input
                  id='phoneNumber'
                  name='phoneNumber'
                  placeholder='+1 555 555 5555'
                  value={values.phoneNumber || ''}
                  onChange={(e) => set('phoneNumber', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, phoneNumber: true }))}
                />
              </FormField>

              <FormField label='Email' htmlFor='email' error={touched.email ? errors.email : undefined}>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  placeholder='john@example.com'
                  value={values.email || ''}
                  onChange={(e) => set('email', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                />
              </FormField>
            </div>
          </Section>

          <Section title='Details'>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <FormField label='Address' htmlFor='address'>
                <Input
                  id='address'
                  name='address'
                  placeholder='123 Main St, City, Country'
                  value={values.address || ''}
                  onChange={(e) => set('address', e.target.value)}
                />
              </FormField>

              <FormField label='Birth date' htmlFor='birthDate'>
                <Input
                  id='birthDate'
                  name='birthDate'
                  type='date'
                  value={values.birthDate ? new Date(values.birthDate).toISOString().slice(0, 10) : ''}
                  onChange={(e) => set('birthDate', e.target.value ? new Date(e.target.value) : (undefined as any))}
                />
              </FormField>

              <div className='sm:col-span-2'>
                <FormField label='Notes' htmlFor='note'>
                  <Textarea
                    id='note'
                    name='note'
                    rows={4}
                    placeholder='Any additional details...'
                    value={values.note || ''}
                    onChange={(e) => set('note', e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          </Section>

          <div className='flex items-center justify-end gap-3'>
            <Button type='button' variant='ghost' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' variant='primary' loading={loading} disabled={!isValid}>
              Create contact
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
