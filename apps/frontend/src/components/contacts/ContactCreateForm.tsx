import { useState } from 'react';
import type { CreateContactDto } from 'shared-types';
import Card from '../common/layout/Card';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import Button from '../common/ui/Button';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import type { E164Number } from 'libphonenumber-js/core';
import '../../styles/phone-input.css';

export type ContactCreateFormProps = {
  onCreate: (data: CreateContactDto) => Promise<void> | void;
  loading?: boolean;
};

import { useAuth } from '../../lib/auth/auth-context';

export function ContactCreateForm({ onCreate, loading }: ContactCreateFormProps) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState<E164Number | undefined>();
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    firstName: firstName.trim() ? undefined : 'First name is required',
    lastName: lastName.trim() ? undefined : 'Last name is required',
    phoneNumber:
      phoneNumber && isValidPhoneNumber(phoneNumber) ? undefined : 'A valid Singapore phone number is required',
    companyId: user?.companyId ? undefined : 'Company ID is required',
  };

  const isValid = !errors.firstName && !errors.lastName && !errors.phoneNumber && !errors.companyId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, phoneNumber: true, companyId: true });
    if (!isValid || !phoneNumber) return;

    const payload: CreateContactDto = {
      companyId: user!.companyId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
    };

    await onCreate(payload);
    setFirstName('');
    setLastName('');
    setPhoneNumber(undefined);
    setEmail('');
    setAddress('');
    setNote('');
  };

  return (
    <Card title='Create Contact' description='Add a new contact to your address book.'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* companyId is inferred from the authenticated user */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            label='First Name'
            htmlFor='firstName'
            required
            error={touched.firstName ? errors.firstName : undefined}
          >
            <Input
              id='firstName'
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='John'
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
            />
          </FormField>

          <FormField
            label='Last Name'
            htmlFor='lastName'
            required
            error={touched.lastName ? errors.lastName : undefined}
          >
            <Input
              id='lastName'
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder='Doe'
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
            />
          </FormField>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            label='Phone Number'
            htmlFor='phoneNumber'
            required
            error={touched.phoneNumber ? errors.phoneNumber : undefined}
          >
            <PhoneInput
              id='phoneNumber'
              placeholder='Enter phone number'
              value={phoneNumber}
              onChange={setPhoneNumber}
              onBlur={() => setTouched((t) => ({ ...t, phoneNumber: true }))}
              defaultCountry='SG'
              international
              countryCallingCodeEditable={false}
            />
          </FormField>

          <FormField label='Email' htmlFor='email' helpText='Optional'>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='john.doe@example.com'
            />
          </FormField>
        </div>

        <FormField label='Address' htmlFor='address' helpText='Optional'>
          <Input
            id='address'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder='123 Main St, Anytown, USA'
          />
        </FormField>

        <FormField label='Note' htmlFor='note' helpText='Optional'>
          <Textarea
            id='note'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Optional note about the contact'
            rows={3}
          />
        </FormField>

        <div className='flex justify-end'>
          <Button type='submit' loading={loading} disabled={!isValid}>
            Create Contact
          </Button>
        </div>
      </form>
    </Card>
  );
}
