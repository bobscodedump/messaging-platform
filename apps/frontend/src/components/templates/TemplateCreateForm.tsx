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
  const [lastCreatedName, setLastCreatedName] = useState<string | null>(null);

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
    setLastCreatedName(form.name);
    setStep('done');
    setForm({ companyId: defaultCompanyId, name: '', content: '' });
  };

  const StepIndicator = () => (
    <ol className='flex items-center gap-3 text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400 mb-4'>
      {['Edit', 'Review', 'Done'].map((label, i) => {
        const order: ('edit' | 'verify' | 'done')[] = ['edit', 'verify', 'done'];
        const active = step === order[i];
        const completed = order.indexOf(step) > i;
        return (
          <li key={label} className='flex items-center gap-2'>
            <span
              className={
                'h-5 w-5 rounded-full grid place-content-center text-[10px] ' +
                (active
                  ? 'bg-indigo-600 text-white shadow'
                  : completed
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300')
              }
            >
              {i + 1}
            </span>
            <span className={active ? 'text-indigo-600 dark:text-indigo-400' : ''}>{label}</span>
            {i < 2 && <span className='opacity-50'>/</span>}
          </li>
        );
      })}
    </ol>
  );

  return (
    <Section title='New Template'>
      <div className='space-y-10'>
        <div>
          <Card title='Define template' description='Use {{variable}} syntax. Built-ins (contact./company.) auto-fill.'>
            <div className='space-y-4'>
              <StepIndicator />
              {step === 'done' && (
                <div className='rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 flex items-start gap-3'>
                  <span className='mt-0.5 inline-block h-2 w-2 rounded-full bg-green-500' />
                  <div>
                    <strong>{lastCreatedName}</strong> created successfully.
                    <div>
                      <button
                        type='button'
                        className='mt-1 text-green-700 underline underline-offset-2 hover:text-green-600'
                        onClick={() => setStep('edit')}
                      >
                        Create another
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <FormField label='Name' error={errors.name}>
                <Input
                  placeholder='Welcome message'
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  disabled={createMutation.isPending || step === 'verify' || step === 'done'}
                />
              </FormField>

              <FormField
                label='Content'
                error={errors.content}
                helpText='Variables must be in the form {{name}}. Built-ins like {{contact.first_name}} are auto-filled.'
              >
                <div className='relative'>
                  <Textarea
                    rows={8}
                    placeholder='Hi {{contact.first_name}}, welcome to {{company.name}}!'
                    value={form.content}
                    onChange={(e) => onChange('content', e.target.value)}
                    disabled={createMutation.isPending || step === 'verify' || step === 'done'}
                  />
                  {extracted.length > 0 && (
                    <div className='absolute top-1 right-1 flex flex-wrap gap-1 max-w-[60%] justify-end'>
                      {extracted.slice(0, 6).map((v) => (
                        <span
                          key={v}
                          className='rounded bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-300'
                        >
                          {v}
                        </span>
                      ))}
                      {extracted.length > 6 && (
                        <span className='rounded bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 text-[10px] font-medium'>
                          +{extracted.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </FormField>

              <div className='flex items-center justify-between'>
                <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                  Detected variables: {extracted.length > 0 ? extracted.join(', ') : 'none'}
                </div>
                {step === 'edit' && (
                  <Button onClick={submitTemplate} disabled={createMutation.isPending || !form.name || !form.content}>
                    {createMutation.isPending ? 'Checking…' : 'Review'}
                  </Button>
                )}
                {step === 'verify' && (
                  <div className='flex gap-2'>
                    <Button variant='ghost' onClick={() => setStep('edit')} disabled={createMutation.isPending}>
                      Edit
                    </Button>
                    <Button onClick={finalize} disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {step === 'verify' && (
            <Card className='mt-6' title='Review & preview' description='Confirm content before saving.'>
              <div className='space-y-4'>
                <div className='rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 p-4 text-sm leading-relaxed whitespace-pre-wrap'>
                  {form.content || '—'}
                </div>
                <div className='text-xs uppercase tracking-wide text-neutral-500'>Variables</div>
                <div className='flex flex-wrap gap-1'>
                  {extracted.length === 0 && <span className='text-xs text-neutral-500'>None</span>}
                  {extracted.map((v) => (
                    <span
                      key={v}
                      className='rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 px-2 py-0.5 text-[11px] font-medium'
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
        <Card title='Reference' description='Built-in variables & authoring tips'>
          <div className='grid gap-8 md:grid-cols-2'>
            <div>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500'>Built-ins</h4>
              <ul className='text-sm space-y-2 text-neutral-700 dark:text-neutral-300'>
                <li>
                  <code className='px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>
                    {'{{contact.first_name}}'}
                  </code>{' '}
                  – Contact first name
                </li>
                <li>
                  <code className='px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>
                    {'{{contact.last_name}}'}
                  </code>{' '}
                  – Contact last name
                </li>
                <li>
                  <code className='px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>
                    {'{{contact.phone_number}}'}
                  </code>{' '}
                  – Contact phone number
                </li>
                <li>
                  <code className='px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800'>{'{{company.name}}'}</code>{' '}
                  – Company name
                </li>
              </ul>
              <div className='mt-4 text-xs text-neutral-500 dark:text-neutral-400'>
                These variables are auto-populated; no need to declare them.
              </div>
            </div>
            <div>
              <h4 className='mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500'>Tips</h4>
              <ul className='list-disc pl-5 text-sm text-neutral-600 dark:text-neutral-400 space-y-1'>
                <li>
                  Wrap names in {'{{variable}}'} (e.g. {'{{promo_code}}'}).
                </li>
                <li>Use lowercase_with_underscores for consistency.</li>
                <li>Keep content concise; personalization increases engagement.</li>
                <li>Built-ins override user-supplied variables of the same name.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}
