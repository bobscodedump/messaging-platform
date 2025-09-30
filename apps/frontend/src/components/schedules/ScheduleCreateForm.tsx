import { useMemo, useState } from 'react';
import { useAuth } from '../../lib/auth/auth-context';
import Card from '../common/layout/Card';
import FormField from '../common/ui/FormField';
import Input from '../common/ui/Input';
import Button from '../common/ui/Button';
import type { ScheduleType } from 'shared-types';
import { useContacts } from '../../lib/contacts/hooks';
import { useGroups } from '../../lib/groups/hooks';
import { useTemplates } from '../../lib/templates/hooks';
import { useCreateSchedule } from '../../lib/schedules/hooks';

export default function ScheduleCreateForm() {
  const { user } = useAuth();
  const companyId = user!.companyId;
  const { data: contacts = [] } = useContacts(companyId);
  const { data: groups = [] } = useGroups(companyId);
  const { data: templates = [] } = useTemplates(companyId);
  const createScheduleMutation = useCreateSchedule();

  // Core state
  const [name, setName] = useState('');
  const [messageSource, setMessageSource] = useState<'content' | 'template'>('content');
  const [content, setContent] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [scheduleType, setScheduleType] = useState<ScheduleType>('ONE_TIME');
  const [scheduledAt, setScheduledAt] = useState<string>(''); // ISO string for ONE_TIME
  const [weeklyDay, setWeeklyDay] = useState<string>('MO'); // e.g., MO, TU, ...
  const [monthlyDay, setMonthlyDay] = useState<number>(1); // 1-28
  const [yearlyMonth, setYearlyMonth] = useState<number>(1); // 1-12
  const [yearlyDay, setYearlyDay] = useState<number>(1); // 1-31
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const selectedTemplate = useMemo(() => templates.find((t) => t.id === templateId) || null, [templates, templateId]);

  // When template changes, reset variable inputs based on template.variables
  useMemo(() => {
    if (!selectedTemplate) {
      setTemplateVars({});
      return;
    }
    const next: Record<string, string> = {};
    for (const v of selectedTemplate.variables) next[v] = templateVars[v] ?? '';
    setTemplateVars(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  // Validation helpers
  const nowLocalForInput = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }, []);

  const isOneTimePast = useMemo(() => {
    if (scheduleType !== 'ONE_TIME' || !scheduledAt) return false;
    const picked = new Date(scheduledAt).getTime();
    return picked < Date.now();
  }, [scheduleType, scheduledAt]);

  const selectedContactsArr = useMemo(
    () => contacts.filter((c) => selectedContacts.has(c.id)),
    [contacts, selectedContacts]
  );
  const selectedWithBirthdays = useMemo(
    () => selectedContactsArr.filter((c: any) => !!c.birthDate),
    [selectedContactsArr]
  );
  const canUseBirthday = selectedWithBirthdays.length > 0;

  function toggleContact(id: string) {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const recipientCount = selectedContacts.size + selectedGroups.size; // rough count preview

  async function onSubmit() {
    const dto = {
      name,
      scheduleType,
      content: messageSource === 'content' ? content : '',
      templateId: messageSource === 'template' ? templateId : undefined,
      variables: messageSource === 'template' ? templateVars : undefined,
      scheduledAt: scheduleType === 'ONE_TIME' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      recurringPattern:
        scheduleType === 'WEEKLY'
          ? JSON.stringify({ day: weeklyDay })
          : scheduleType === 'MONTHLY'
            ? JSON.stringify({ day: monthlyDay })
            : scheduleType === 'YEARLY'
              ? JSON.stringify({ month: yearlyMonth, day: yearlyDay })
              : scheduleType === 'BIRTHDAY'
                ? JSON.stringify({ rule: 'BIRTHDAY' })
                : undefined,
      contactIds: Array.from(selectedContacts),
      groupIds: Array.from(selectedGroups),
    } as const;

    console.group('Create Schedule (submit DTO)');
    console.log(dto);
    console.groupEnd();

    try {
      const created = await createScheduleMutation.mutateAsync(dto);
      console.log('Created schedule:', created);
      alert('Schedule created');
      // reset minimal state
      setName('');
      setContent('');
      setTemplateId('');
      setSelectedContacts(new Set());
      setSelectedGroups(new Set());
    } catch (e: any) {
      alert(`Failed to create schedule: ${e.message || e}`);
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-semibold text-neutral-900 dark:text-neutral-100'>Create Schedule</h1>
        <div className='text-sm text-neutral-500'>Recipients: {recipientCount}</div>
      </div>

      {/* Recipients */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card title='Contacts'>
          <ul className='max-h-80 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800'>
            {contacts.map((c) => (
              <li key={c.id} className='flex items-center gap-3 p-2'>
                <input type='checkbox' checked={selectedContacts.has(c.id)} onChange={() => toggleContact(c.id)} />
                <div className='flex-1'>
                  <div className='font-medium'>{c.firstName + ' ' + c.lastName}</div>
                  <div className='text-xs text-neutral-500'>{c.phoneNumber}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title='Groups'>
          <ul className='max-h-80 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800'>
            {groups.map((g) => (
              <li key={g.id} className='flex items-center gap-3 p-2'>
                <input type='checkbox' checked={selectedGroups.has(g.id)} onChange={() => toggleGroup(g.id)} />
                <div className='flex-1'>
                  <div className='font-medium'>{g.name}</div>
                  <div className='text-xs text-neutral-500'>group</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Message setup */}
      <Card title='Message' description='Use a direct message or pick a template with variable fallbacks.'>
        <div className='flex gap-3 text-sm'>
          <button
            className={`px-3 py-1 rounded-md border ${
              messageSource === 'content'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-neutral-300 dark:border-neutral-700'
            }`}
            onClick={() => setMessageSource('content')}
          >
            Direct Content
          </button>
          <button
            className={`px-3 py-1 rounded-md border ${
              messageSource === 'template'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-neutral-300 dark:border-neutral-700'
            }`}
            onClick={() => setMessageSource('template')}
          >
            Use Template
          </button>
        </div>

        {messageSource === 'content' ? (
          <FormField label='Content' htmlFor='content' helpText='What message should be sent?'>
            <textarea
              id='content'
              className='w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </FormField>
        ) : (
          <div className='space-y-4'>
            <FormField label='Template'>
              <select
                className='w-full rounded-md border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800'
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value=''>-- Select a template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>
            {selectedTemplate ? (
              <div className='p-3 border rounded-md bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-800'>
                <div className='text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap'>
                  {selectedTemplate.content}
                </div>
                <div className='mt-3 space-y-3'>
                  <h4 className='font-medium'>Variable fallbacks</h4>
                  {selectedTemplate.variables.map((v) => (
                    <FormField key={v} label={v} htmlFor={`var-${v}`} helpText={`Value for ${v}`}>
                      <Input
                        id={`var-${v}`}
                        placeholder={`Value for ${v}`}
                        value={templateVars[v] ?? ''}
                        onChange={(e) => setTemplateVars((prev) => ({ ...prev, [v]: e.target.value }))}
                      />
                    </FormField>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {/* Schedule */}
      <Card title='Schedule' description='Choose when this message should be delivered.'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <FormField label='Schedule Name' htmlFor='scheduleName' helpText='For your reference in the dashboard.'>
            <Input
              id='scheduleName'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g., Friday Promo Blast'
            />
          </FormField>
          <FormField label='Type' htmlFor='scheduleType'>
            <select
              id='scheduleType'
              className='w-full rounded-md border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800'
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
            >
              <option value='ONE_TIME'>One time</option>
              <option value='WEEKLY'>Weekly</option>
              <option value='MONTHLY'>Monthly</option>
              <option value='YEARLY'>Yearly</option>
              <option value='BIRTHDAY'>Birthday</option>
            </select>
          </FormField>
        </div>

        {/* Type-specific inputs */}
        {scheduleType === 'ONE_TIME' && (
          <FormField
            label='When'
            htmlFor='scheduledAt'
            helpText='Pick the exact date and time.'
            error={isOneTimePast ? 'Time must be in the future' : undefined}
          >
            <Input
              id='scheduledAt'
              type='datetime-local'
              min={nowLocalForInput}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </FormField>
        )}
        {scheduleType === 'WEEKLY' && (
          <FormField label='Day of week' htmlFor='weeklyDay'>
            <select
              id='weeklyDay'
              className='w-full rounded-md border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800'
              value={weeklyDay}
              onChange={(e) => setWeeklyDay(e.target.value)}
            >
              <option value='MO'>Monday</option>
              <option value='TU'>Tuesday</option>
              <option value='WE'>Wednesday</option>
              <option value='TH'>Thursday</option>
              <option value='FR'>Friday</option>
              <option value='SA'>Saturday</option>
              <option value='SU'>Sunday</option>
            </select>
          </FormField>
        )}
        {scheduleType === 'MONTHLY' && (
          <FormField label='Day of month' htmlFor='monthlyDay'>
            <Input
              id='monthlyDay'
              type='number'
              min={1}
              max={28}
              value={monthlyDay}
              onChange={(e) => setMonthlyDay(Number(e.target.value))}
            />
          </FormField>
        )}
        {scheduleType === 'YEARLY' && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <FormField label='Month' htmlFor='yearlyMonth'>
              <Input
                id='yearlyMonth'
                type='number'
                min={1}
                max={12}
                value={yearlyMonth}
                onChange={(e) => setYearlyMonth(Number(e.target.value))}
              />
            </FormField>
            <FormField label='Day' htmlFor='yearlyDay'>
              <Input
                id='yearlyDay'
                type='number'
                min={1}
                max={31}
                value={yearlyDay}
                onChange={(e) => setYearlyDay(Number(e.target.value))}
              />
            </FormField>
          </div>
        )}

        {scheduleType === 'BIRTHDAY' && (
          <div className='space-y-2'>
            <p className='text-sm text-neutral-600 dark:text-neutral-400'>Will send at each contact's next birthday.</p>
            <p className='text-sm'>
              Selected with birthdays: <span className='font-medium'>{selectedWithBirthdays.length}</span>
            </p>
            {!canUseBirthday ? (
              <div className='text-sm text-red-600'>At least one selected contact must have a birthday.</div>
            ) : null}
          </div>
        )}
      </Card>

      <div className='flex justify-end gap-2'>
        <Button variant='ghost' onClick={() => console.log('Cancelled schedule creation')}>
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={
            recipientCount === 0 ||
            (messageSource === 'content'
              ? content.trim().length === 0
              : !templateId ||
                !selectedTemplate ||
                selectedTemplate.variables.some((v) => !templateVars[v] || !templateVars[v].trim())) ||
            (scheduleType === 'ONE_TIME' && (!scheduledAt || isOneTimePast)) ||
            (scheduleType === 'BIRTHDAY' && !canUseBirthday)
          }
        >
          Create Schedule
        </Button>
      </div>
    </div>
  );
}
