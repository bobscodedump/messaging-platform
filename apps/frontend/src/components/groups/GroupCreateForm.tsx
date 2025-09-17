import { useState } from 'react';
import type { CreateGroupDto } from 'shared-types';
import Card from '../common/layout/Card';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import Button from '../common/ui/Button';
import Select from '../common/ui/Select';

export type GroupCreateFormProps = {
  defaultCompanyId?: string;
  onCreate: (data: CreateGroupDto) => Promise<void> | void;
  loading?: boolean;
  companies?: { label: string; value: string }[];
};

export function GroupCreateForm({
  defaultCompanyId = 'company-1',
  onCreate,
  loading,
  companies,
}: GroupCreateFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = {
    name: name.trim() ? undefined : 'Group name is required',
    companyId: companyId.trim() ? undefined : 'Company ID is required',
  } as const;

  const isValid = !errors.name && !errors.companyId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, companyId: true });
    if (!isValid) return;

    const payload: CreateGroupDto = {
      companyId: companyId.trim(),
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
          <FormField
            label='Company'
            htmlFor='companyId'
            required
            helpText={companies ? 'Choose a company' : 'Enter the company ID'}
            error={touched.companyId ? errors.companyId : undefined}
          >
            {companies ? (
              <Select
                id='companyId'
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                options={companies}
                className='w-full'
                error={touched.companyId ? errors.companyId : undefined}
              />
            ) : (
              <Input
                id='companyId'
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder='company-id'
                onBlur={() => setTouched((t) => ({ ...t, companyId: true }))}
              />
            )}
          </FormField>

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
