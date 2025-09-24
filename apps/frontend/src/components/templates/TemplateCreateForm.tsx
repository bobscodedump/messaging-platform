import { useMemo, useState } from 'react';
import Section from '../common/layout/Section';
import Card from '../common/layout/Card';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import Button from '../common/ui/Button';
import type { CreateTemplateDto } from 'shared-types';
import { extractTemplateVariables, useCreateTemplate, validateTemplateInput } from '../../lib/templates/hooks';

export function TemplateCreateForm({ defaultCompanyId }: { defaultCompanyId: string }) {
  const [step, setStep] = useState<'edit' | 'verify' | 'done'>('edit');
  const [form, setForm] = useState<CreateTemplateDto>({ companyId: defaultCompanyId, name: '', content: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTemplateDto, string>>>({});

  const extracted = useMemo(() => extractTemplateVariables(form.content), [form.content]);
  const createMutation = useCreateTemplate();

  const onChange = (field: keyof CreateTemplateDto, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submitTemplate = async () => {
    const { valid, errors } = validateTemplateInput(form);
    setErrors(errors);
    if (!valid) return;
    setStep('verify');
  };

  const finalize = async () => {
    const dto: CreateTemplateDto = { ...form, variables: extracted };
    await createMutation.mutateAsync(dto);
    setStep('done');
    setForm({ companyId: defaultCompanyId, name: '', content: '' });
  };

  return (
    <Section title='Create Template'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <div className='md:col-span-2'>
          <Card
            title='Template'
            description='Define the template name and content. Use {{variable}} syntax to add variables.'
          >
            <div className='space-y-4'>
              <FormField label='Name' error={errors.name}>
                <Input
                  placeholder='Welcome message'
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                />
              </FormField>

              <FormField label='Content' error={errors.content} helpText='Variables must be in the form {{name}}.'>
                <Textarea
                  rows={8}
                  placeholder='Hi {{firstName}}, welcome to {{company}}!'
                  value={form.content}
                  onChange={(e) => onChange('content', e.target.value)}
                />
              </FormField>

              <div className='flex items-center justify-between'>
                <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                  Detected variables: {extracted.length > 0 ? extracted.join(', ') : 'none'}
                </div>
                <Button onClick={submitTemplate}>Submit</Button>
              </div>
            </div>
          </Card>

          {step !== 'edit' ? (
            <Card className='mt-6' title='Verification' description='Confirm the template before saving.'>
              <div className='space-y-3'>
                <div>
                  <div className='text-xs uppercase text-neutral-500'>Preview</div>
                  <div className='rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800'>
                    {form.content || '—'}
                  </div>
                </div>
                <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                  Variables identified: {extracted.length > 0 ? extracted.join(', ') : 'none'}
                </div>
                <div className='flex justify-end gap-2'>
                  <Button variant='ghost' onClick={() => setStep('edit')}>
                    Back
                  </Button>
                  <Button onClick={finalize}>Save locally</Button>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        <div className='md:col-span-1'>
          <Card title='Tips' description='How variables work'>
            <ul className='list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400'>
              <li>Wrap variable names in double curly braces, e.g. {'{{variableName}}'}.</li>
              <li>
                Variables can include letters, numbers, and underscores, and must start with a letter or underscore.
              </li>
              <li>Variables are saved as names only (no descriptions), per schema.</li>
            </ul>
          </Card>
        </div>
      </div>
    </Section>
  );
}
