import { useState } from 'react';
import Section from '../common/layout/Section';
import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import { extractTemplateVariables, validateTemplateInput } from '../../lib/templates/hooks';
import { useCreateTemplate, useDeleteTemplate, useTemplates } from '../../lib/templates/hooks';
import type { CreateTemplateDto } from 'shared-types';
import TemplateModal from './TemplateModal';

export default function TemplateDashboard() {
  const companyId = 'cmeic3bb30000oh3wub0sckq3';

  const { data: templates = [], isLoading, error } = useTemplates(companyId);
  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate(companyId);

  const [form, setForm] = useState<CreateTemplateDto>({ companyId, name: '', content: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTemplateDto, string>>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const onChange = (field: keyof CreateTemplateDto, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const onSubmit = async () => {
    const { valid, errors } = validateTemplateInput(form);
    setErrors(errors);
    if (!valid) return;
    const variables = extractTemplateVariables(form.content);
    await createMutation.mutateAsync({ ...form, variables });
    setForm({ companyId, name: '', content: '' });
  };

  return (
    <div className='mx-auto max-w-6xl p-6 space-y-6'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <h1 className='text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Templates</h1>
          <p className='text-sm text-neutral-600 dark:text-neutral-400'>Create and manage message templates.</p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <div className='md:col-span-2'>
          <Section title='Create template'>
            <Card title='New template' description='Use {{variable}} to mark variables.'>
              <div className='space-y-4'>
                <FormField label='Name' error={errors.name}>
                  <Input value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder='Welcome' />
                </FormField>
                <FormField label='Content' error={errors.content} helperText='Example: Hi {{firstName}}!'>
                  <Textarea rows={6} value={form.content} onChange={(e) => onChange('content', e.target.value)} />
                </FormField>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                    Detected: {extractTemplateVariables(form.content).join(', ') || 'none'}
                  </div>
                  <Button onClick={onSubmit} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            </Card>
          </Section>
        </div>
        <div className='md:col-span-1'>
          <Section title='Existing templates'>
            <Card>
              {isLoading ? (
                <div className='py-8 text-center text-sm text-neutral-500'>Loading…</div>
              ) : error ? (
                <div className='rounded-md border border-red-300 bg-red-50 p-3 text-red-700'>
                  Failed to load templates: {error.message}
                </div>
              ) : templates.length === 0 ? (
                <div className='py-8 text-center text-sm text-neutral-500'>No templates</div>
              ) : (
                <ul className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                  {templates.map((t) => (
                    <li key={t.id} className='flex items-center justify-between gap-3 py-3'>
                      <button className='min-w-0 text-left' onClick={() => setOpenId(t.id)}>
                        <div className='truncate font-medium text-neutral-900 dark:text-neutral-100'>{t.name}</div>
                        <div className='truncate text-xs text-neutral-500'>
                          Vars: {t.variables.join(', ') || 'none'}
                        </div>
                      </button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => {
                          const ok = window.confirm(`Delete template "${t.name}"?`);
                          if (ok) deleteMutation.mutate(t.id);
                        }}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>
        </div>
      </div>

      {openId ? <TemplateModal templateId={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
