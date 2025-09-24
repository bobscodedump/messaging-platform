import { useState } from 'react';
import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
import { useMessageRecipients } from '../../lib/messages/hooks';
import { useTemplates } from '../../lib/templates/hooks';
import type { Contact, Group } from 'shared-types';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';

type Step = 'recipients' | 'template' | 'review';

function resolveTemplate(template: string, contact: Contact, fallbacks: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (key in contact && contact[key as keyof Contact]) return String(contact[key as keyof Contact]);
    return fallbacks[key] || '';
  });
}

export default function MessageWizard() {
  const companyId = 'cmeic3bb30000oh3wub0sckq3';
  const [step, setStep] = useState<Step>('recipients');

  // Step 1 state
  const {
    contacts,
    groups,
    selectedContactIds,
    selectedGroupIds,
    toggleContact,
    toggleGroup,
    recipientCount,
    recipientContacts,
  } = useMessageRecipients(companyId);

  // Step 2 state
  const { data: templates = [] } = useTemplates(companyId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [variableFallbacks, setVariableFallbacks] = useState<Record<string, string>>({});

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleSend = () => {
    if (!selectedTemplate || recipientContacts.length === 0) return;
    console.group('Sending messages...');
    recipientContacts.forEach((contact) => {
      const message = resolveTemplate(selectedTemplate.content, contact, variableFallbacks);
      console.log(`To: ${contact.firstName} ${contact.lastName} (${contact.phoneNumber}, ${contact.email})`);
      console.log('Message:', message);
    });
    console.groupEnd();
    // Reset state
    setStep('recipients');
    setSelectedTemplateId(null);
    setVariableFallbacks({});
  };

  return (
    <div className='mx-auto max-w-6xl p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Send Message</h1>
        <div className='flex items-center gap-2 text-sm'>
          <span className={`font-medium ${step === 'recipients' ? 'text-blue-600' : ''}`}>1. Recipients</span>
          <span className='text-neutral-300'>&rarr;</span>
          <span className={`font-medium ${step === 'template' ? 'text-blue-600' : ''}`}>2. Template</span>
          <span className='text-neutral-300'>&rarr;</span>
          <span className={`font-medium ${step === 'review' ? 'text-blue-600' : ''}`}>3. Review</span>
        </div>
      </div>

      {step === 'recipients' && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <RecipientSelector title='Contacts' items={contacts} selected={selectedContactIds} onToggle={toggleContact} />
          <RecipientSelector title='Groups' items={groups} selected={selectedGroupIds} onToggle={toggleGroup} />
        </div>
      )}

      {step === 'template' && (
        <Card
          title='Select a template'
          description='Choose the message template and provide fallback values for variables.'
        >
          <div className='space-y-4'>
            <select
              className='w-full rounded-md border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800'
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              value={selectedTemplateId ?? ''}
            >
              <option value='' disabled>
                -- Select a template --
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <div className='p-4 border rounded-md bg-neutral-50 dark:bg-neutral-900'>
                <h3 className='font-medium mb-2'>Template Preview</h3>
                <p className='text-sm text-neutral-600 dark:text-neutral-300'>{selectedTemplate.content}</p>
                <div className='mt-4'>
                  <h4 className='font-medium mb-2'>Variable Fallbacks</h4>
                  {selectedTemplate.variables.map((v) => (
                    <FormField key={v} label={v}>
                      <Input
                        placeholder={`Default value for ${v}`}
                        onChange={(e) => setVariableFallbacks((prev) => ({ ...prev, [v]: e.target.value }))}
                      />
                    </FormField>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 'review' && (
        <Card title='Review and Send' description='Confirm the details before sending.'>
          <div className='space-y-4'>
            <div>
              <strong>Recipients:</strong> {recipientCount} contacts
            </div>
            <div>
              <strong>Template:</strong> {selectedTemplate?.name}
            </div>
            <div>
              <strong>Preview:</strong>
              <div className='p-3 border rounded-md text-sm bg-neutral-50 dark:bg-neutral-900'>
                {recipientContacts[0]
                  ? resolveTemplate(selectedTemplate!.content, recipientContacts[0], variableFallbacks)
                  : 'No recipients to preview.'}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className='flex justify-between items-center pt-4 border-t dark:border-neutral-800'>
        <div>
          <span className='text-sm font-medium'>Recipients: {recipientCount}</span>
        </div>
        <div className='flex gap-2'>
          {step !== 'recipients' && (
            <Button variant='ghost' onClick={() => setStep(step === 'template' ? 'recipients' : 'template')}>
              Back
            </Button>
          )}
          {step !== 'review' ? (
            <Button
              onClick={() => setStep(step === 'recipients' ? 'template' : 'review')}
              disabled={recipientCount === 0}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!selectedTemplate}>
              Send Message
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipientSelector({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: (Contact | Group)[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <Card title={title}>
      <div className='max-h-96 overflow-y-auto'>
        <ul className='divide-y divide-neutral-200 dark:divide-neutral-800'>
          {items.map((item) => (
            <li key={item.id} className='flex items-center gap-3 p-2'>
              <input type='checkbox' checked={selected.has(item.id)} onChange={() => onToggle(item.id)} />
              <div className='flex-1'>
                {('firstName' in item) ? (
                  <>
                    <div className='font-medium'>
                      {`${(item.firstName || '').trim()} ${(item.lastName || '').trim()}`.trim() || 'Unnamed contact'}
                    </div>
                    <div className='text-xs text-neutral-600 dark:text-neutral-400'>
                      {[item.phoneNumber, item.email].filter(Boolean).join(' • ')}
                    </div>
                  </>
                ) : (
                  <div className='font-medium'>{(item as Group).name}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
