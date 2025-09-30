import { useState } from 'react';
import type { CreateGroupDto } from 'shared-types';
import Card from '../common/layout/Card';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import Button from '../common/ui/Button';

export type GroupCreateFormProps = {
  onCreate: (data: CreateGroupDto) => Promise<void> | void;
  loading?: boolean;
};

import { useAuth } from '../../lib/auth/auth-context';

export function GroupCreateForm({ onCreate, loading }: GroupCreateFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    name: name.trim() ? undefined : 'Group name is required',
    companyId: user?.companyId ? undefined : 'Company ID is required',
  } as const;

  const isValid = !errors.name && !errors.companyId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, companyId: true });
    if (!isValid) return;

    const payload: CreateGroupDto = {
      companyId: user!.companyId,
      name: name.trim(),
      description: description.trim() || undefined,
    };

    await onCreate(payload);
    setName('');
    setDescription('');
  };

  return (
    <Card title='Create Group' description='Organize contacts by creating a new group.'>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField label='Group Name' htmlFor='groupName' required error={touched.name ? errors.name : undefined}>
            <Input
              id='groupName'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. VIP Customers'
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            />
          </FormField>
        </div>

        <FormField label='Description' htmlFor='groupDescription' helpText='Optional'>
          <Textarea
            id='groupDescription'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Optional group description'
            rows={3}
          />
        </FormField>

        <div className='flex justify-end'>
          <Button type='submit' variant='primary' loading={loading} disabled={!isValid}>
            Create Group
          </Button>
        </div>
      </form>
    </Card>
  );
}
