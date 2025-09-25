import { useState } from 'react';
import Section from '../common/layout/Section';
import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
import { useDeleteTemplate, useTemplates } from '../../lib/templates/hooks';
import TemplateModal from './TemplateModal';

export default function TemplateDashboard({ companyId }: { companyId: string }) {
  const { data: templates = [], isLoading, error } = useTemplates(companyId);
  const deleteMutation = useDeleteTemplate(companyId);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className='space-y-6'>
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
                    <div className='truncate text-xs text-neutral-500'>Vars: {t.variables.join(', ') || 'none'}</div>
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
      {openId ? <TemplateModal templateId={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
