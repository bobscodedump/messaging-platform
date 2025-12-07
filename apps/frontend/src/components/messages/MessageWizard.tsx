import { useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import Card from '../common/layout/Card';
import Button from '../common/ui/Button';
import { useMessageRecipients, useSendMessage } from '../../lib/messages/hooks';
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
  const { user } = useAuth();
  const companyId = user!.companyId;
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const sendMessageMutation = useSendMessage();

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleSend = async () => {
    if (!selectedTemplate || recipientContacts.length === 0 || !user) return;

    setSendError(null);
    setSendSuccess(null);

    try {
      await sendMessageMutation.mutateAsync({
        companyId,
        senderId: user.id,
        templateId: selectedTemplate.id,
        recipientContactIds: recipientContacts.map((c) => c.id),
        variableFallbacks,
      });

      setSendSuccess(`Successfully queued ${recipientContacts.length} messages.`);

      // Reset state after short delay or immediately?
      // Let's keep the success message visible and reset the wizard
      setTimeout(() => {
        setStep('recipients');
        setSelectedTemplateId(null);
        setVariableFallbacks({});
        setSendSuccess(null);
      }, 3000);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send messages');
    }
  };

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      {sendSuccess && (
        <div className='rounded-md bg-green-500/10 p-4 text-sm text-green-700 border border-green-500/20'>
          {sendSuccess}
        </div>
      )}
      {sendError && (
        <div className='rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20'>
          {sendError}
        </div>
      )}

      {/* Stepper */}
      <Card>
        <div className='flex items-center justify-between px-4 py-2'>
          <div
            className={`flex flex-col items-center ${step === 'recipients' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step === 'recipients' || step === 'template' || step === 'review'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-card'
              }`}
            >
              1
            </div>
            <span className='mt-1 text-xs font-medium'>Recipients</span>
          </div>
          <div className='h-0.5 flex-1 bg-border mx-4' />
          <div
            className={`flex flex-col items-center ${step === 'template' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step === 'template' || step === 'review'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-card'
              }`}
            >
              2
            </div>
            <span className='mt-1 text-xs font-medium'>Template</span>
          </div>
          <div className='h-0.5 flex-1 bg-border mx-4' />
          <div className={`flex flex-col items-center ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step === 'review' ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-card'
              }`}
            >
              3
            </div>
            <span className='mt-1 text-xs font-medium'>Review</span>
          </div>
        </div>
      </Card>

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
          <div className='space-y-6'>
            <FormField label='Template'>
              <select
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:ring-ring'
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
            </FormField>

            {selectedTemplate && (
              <div className='rounded border border-border bg-muted/30 p-4'>
                <h3 className='font-medium mb-2 text-foreground'>Template Preview</h3>
                <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{selectedTemplate.content}</p>

                {selectedTemplate.variables.length > 0 && (
                  <div className='mt-4 pt-4 border-t border-border'>
                    <h4 className='font-medium mb-3 text-sm text-foreground'>Variable Fallbacks</h4>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      {selectedTemplate.variables.map((v) => (
                        <FormField key={v} label={v}>
                          <Input
                            placeholder={`Default value for ${v}`}
                            onChange={(e) => setVariableFallbacks((prev) => ({ ...prev, [v]: e.target.value }))}
                            value={variableFallbacks[v] || ''}
                          />
                        </FormField>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {step === 'review' && (
        <Card title='Review and Send' description='Confirm the details before sending.'>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='rounded border border-border p-3'>
                <div className='text-xs text-muted-foreground uppercase font-semibold'>Recipients</div>
                <div className='text-lg font-medium text-foreground'>{recipientCount}</div>
              </div>
              <div className='rounded border border-border p-3 col-span-2'>
                <div className='text-xs text-muted-foreground uppercase font-semibold'>Template</div>
                <div className='text-lg font-medium text-foreground'>{selectedTemplate?.name}</div>
              </div>
            </div>

            <div>
              <div className='text-sm font-medium text-foreground mb-2'>Message Preview (First Recipient)</div>
              <div className='p-4 border border-border rounded-md text-sm bg-muted/30 text-foreground whitespace-pre-wrap'>
                {recipientContacts[0]
                  ? resolveTemplate(selectedTemplate!.content, recipientContacts[0], variableFallbacks)
                  : 'No recipients to preview.'}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className='flex justify-between items-center pt-4'>
        <div className='text-sm text-muted-foreground'>
          Total Recipients: <span className='font-bold text-foreground'>{recipientCount}</span>
        </div>
        <div className='flex gap-3'>
          {step !== 'recipients' && (
            <Button variant='secondary' onClick={() => setStep(step === 'template' ? 'recipients' : 'template')}>
              Back
            </Button>
          )}
          {step !== 'review' ? (
            <Button
              onClick={() => setStep(step === 'recipients' ? 'template' : 'review')}
              disabled={recipientCount === 0 || (step === 'template' && !selectedTemplateId)}
            >
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!selectedTemplate || sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
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
    <Card title={title} className='h-full flex flex-col'>
      <div className='flex-1 min-h-[300px] max-h-[400px] overflow-y-auto -mx-6 px-6'>
        {items.length === 0 ? (
          <div className='text-sm text-muted-foreground py-4 text-center italic'>No items found</div>
        ) : (
          <ul className='divide-y divide-border'>
            {items.map((item) => (
              <li
                key={item.id}
                className='flex items-center gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors cursor-pointer'
                onClick={() => onToggle(item.id)}
              >
                <input
                  type='checkbox'
                  checked={selected.has(item.id)}
                  onChange={() => {}} // Handled by li click
                  className='h-4 w-4 rounded border-input text-primary focus:ring-ring'
                />
                <div className='flex-1'>
                  {'firstName' in item ? (
                    <>
                      <div className='font-medium text-sm text-foreground'>
                        {`${(item.firstName || '').trim()} ${(item.lastName || '').trim()}`.trim() || 'Unnamed contact'}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {[item.phoneNumber, item.email].filter(Boolean).join(' • ')}
                      </div>
                    </>
                  ) : (
                    <div className='font-medium text-sm text-foreground'>{(item as Group).name}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
