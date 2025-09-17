import { useEffect, useMemo, useState } from 'react';
import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Textarea from '../common/ui/Textarea';
import {
  extractTemplateVariables,
  validateTemplateInput,
  useTemplate,
  useUpdateTemplate,
} from '../../lib/templates/hooks';
import type { CreateTemplateDto } from 'shared-types';

export type TemplateModalProps = {
  templateId: string;
  onClose: () => void;
};

export default function TemplateModal({ templateId, onClose }: TemplateModalProps) {
  const { data: tpl, isLoading, error } = useTemplate(templateId);
  const updateMutation = useUpdateTemplate();

  const [form, setForm] = useState<CreateTemplateDto | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTemplateDto, string>>>({});

  useEffect(() => {
    if (tpl) setForm({ companyId: tpl.companyId, name: tpl.name, content: tpl.content });
  }, [tpl]);

  const detected = useMemo(() => extractTemplateVariables(form?.content ?? ''), [form?.content]);

  const onChange = (field: keyof CreateTemplateDto, value: string) => {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  };

  const onSave = async () => {
    if (!form) return;
    const { valid, errors } = validateTemplateInput(form);
    setErrors(errors);
    if (!valid) return;
    await updateMutation.mutateAsync({
      id: templateId,
      data: { name: form.name, content: form.content, variables: detected },
    });
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/50' onClick={onClose} />
      <div className='relative z-10 w-full max-w-2xl px-4'>
        <Card
          title={tpl ? `Edit: ${tpl.name}` : 'Loading template…'}
          description={tpl ? 'Update name/content. Variables are auto-detected.' : undefined}
          footer={
            <div className='flex justify-end gap-2'>
              <Button variant='ghost' onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={updateMutation.isPending || !form}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          }
        >
          {isLoading ? (
            <div className='py-6 text-center text-sm text-neutral-500'>Loading…</div>
          ) : error ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-3 text-red-700'>{error.message}</div>
          ) : form ? (
            <div className='space-y-4'>
              <FormField label='Name' error={errors.name}>
                <Input value={form.name} onChange={(e) => onChange('name', e.target.value)} />
              </FormField>
              <FormField label='Content' error={errors.content} helperText='Use {{name}} for variables.'>
                <Textarea rows={8} value={form.content} onChange={(e) => onChange('content', e.target.value)} />
              </FormField>
              <div className='text-sm text-neutral-600 dark:text-neutral-400'>
                Detected variables: {detected.join(', ') || 'none'}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
