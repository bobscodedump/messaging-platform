import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import { useCompany, useUpdateCompany } from '../lib/companies/hooks';

// Common timezones for the dropdown
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function SettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const isAdmin = user?.role === 'PLATFORM_ADMIN' || user?.role === 'COMPANY_ADMIN';

  const {
    data: company,
    isLoading: companyLoading,
    isError: companyError,
    error: companyErrorObj,
  } = useCompany(companyId);

  const updateCompanyMutation = useUpdateCompany(companyId);

  const [formData, setFormData] = useState({
    name: '',
    whatsappPhone: '',
    whatsappApiKey: '',
    whatsappApiUrl: '',
    messageSendDelayMs: 5000,
    timezone: 'Asia/Singapore',
    googleCalendarId: '',
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name ?? '',
        whatsappPhone: company.whatsappPhone ?? '',
        whatsappApiKey: company.whatsappApiKey ?? '',
        whatsappApiUrl: company.whatsappApiUrl ?? '',
        messageSendDelayMs: company.messageSendDelayMs ?? 5000,
        timezone: company.timezone ?? 'Asia/Singapore',
        googleCalendarId: company.googleCalendarId ?? '',
      });
    }
  }, [company]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!companyId) return;
    setFeedback(null);

    try {
      await updateCompanyMutation.mutateAsync({
        name: formData.name,
        whatsappPhone: formData.whatsappPhone || null,
        whatsappApiKey: formData.whatsappApiKey || null,
        whatsappApiUrl: formData.whatsappApiUrl || null,
        messageSendDelayMs: formData.messageSendDelayMs,
        timezone: formData.timezone,
        googleCalendarId: formData.googleCalendarId || null,
      });
      setFeedback({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save settings',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className='mx-auto max-w-5xl p-4 sm:p-6'>
        <div className='rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-200'>
          <h2 className='font-medium'>Access Denied</h2>
          <p className='text-sm'>Only company administrators can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold text-neutral-900 dark:text-white'>Company Settings</h1>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>
          Configure your company's WhatsApp integration, messaging behavior, and calendar settings.
        </p>
      </div>

      {companyLoading && (
        <div className='text-sm text-neutral-500 dark:text-neutral-400'>Loading settings…</div>
      )}

      {companyError && (
        <div className='rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-200'>
          {(companyErrorObj as Error)?.message || 'Failed to load company settings'}
        </div>
      )}

      {!companyLoading && !companyError && (
        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Company Info Section */}
          <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
            <header className='mb-4'>
              <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Company Information</h2>
              <p className='text-xs text-neutral-500'>Basic company details</p>
            </header>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  Company Name
                </span>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                  required
                  disabled={updateCompanyMutation.isPending}
                />
              </label>
              <div className='sm:col-span-2 text-xs text-neutral-500'>
                Company ID: <code className='bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded'>{company?.id ?? '—'}</code>
              </div>
            </div>
          </section>

          {/* WhatsApp Configuration Section */}
          <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
            <header className='mb-4'>
              <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>WhatsApp Configuration</h2>
              <p className='text-xs text-neutral-500'>Configure your WaSender API integration for sending WhatsApp messages</p>
            </header>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='flex flex-col gap-1'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  WhatsApp Phone Number
                </span>
                <input
                  type='text'
                  value={formData.whatsappPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappPhone: e.target.value }))}
                  className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                  placeholder='+65 1234 5678'
                  disabled={updateCompanyMutation.isPending}
                />
                <span className='text-xs text-neutral-400'>The phone number connected to your WhatsApp Business</span>
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  WaSender API Key
                </span>
                <div className='relative'>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.whatsappApiKey}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsappApiKey: e.target.value }))}
                    className='w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 pr-16 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                    placeholder='Your API key'
                    disabled={updateCompanyMutation.isPending}
                  />
                  <button
                    type='button'
                    onClick={() => setShowApiKey(!showApiKey)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-500 hover:text-indigo-400'
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className='text-xs text-neutral-400'>Get this from your WaSender dashboard</span>
              </label>
              <label className='flex flex-col gap-1 sm:col-span-2'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  WhatsApp API URL
                </span>
                <input
                  type='url'
                  value={formData.whatsappApiUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappApiUrl: e.target.value }))}
                  className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                  placeholder='https://wasenderapi.com/api (default)'
                  disabled={updateCompanyMutation.isPending}
                />
                <span className='text-xs text-neutral-400'>Leave blank to use default WaSender API URL</span>
              </label>
            </div>
          </section>

          {/* Messaging Settings Section */}
          <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
            <header className='mb-4'>
              <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Messaging Settings</h2>
              <p className='text-xs text-neutral-500'>Configure message sending behavior</p>
            </header>
            <div className='grid gap-4 sm:grid-cols-2'>
              <label className='flex flex-col gap-1'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  Message Send Delay (ms)
                </span>
                <input
                  type='number'
                  value={formData.messageSendDelayMs}
                  onChange={(e) => setFormData((prev) => ({ ...prev, messageSendDelayMs: parseInt(e.target.value) || 0 }))}
                  className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                  min='0'
                  max='60000'
                  step='100'
                  disabled={updateCompanyMutation.isPending}
                />
                <span className='text-xs text-neutral-400'>
                  Delay between sending messages to prevent rate limiting. Default: 5000ms (5 seconds)
                </span>
              </label>
              <label className='flex flex-col gap-1'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  Timezone
                </span>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                  disabled={updateCompanyMutation.isPending}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <span className='text-xs text-neutral-400'>Used for scheduling messages and displaying times</span>
              </label>
            </div>
          </section>

          {/* Calendar Integration Section */}
          <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
            <header className='mb-4'>
              <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Calendar Integration</h2>
              <p className='text-xs text-neutral-500'>Connect your Google Calendar for appointment reminders</p>
            </header>
            <div className='grid gap-4'>
              <label className='flex flex-col gap-1'>
                <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                  Google Calendar ID
                </span>
                <input
                  type='text'
                  value={formData.googleCalendarId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, googleCalendarId: e.target.value }))}
                  className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                  placeholder='your-calendar-id@group.calendar.google.com'
                  disabled={updateCompanyMutation.isPending}
                />
                <span className='text-xs text-neutral-400'>
                  Find this in Google Calendar → Settings → Calendar ID. Used for n8n appointment reminder workflows.
                </span>
              </label>
            </div>
          </section>

          {/* Submit Section */}
          <div className='flex items-center justify-between'>
            <div>
              {feedback && (
                <p
                  className={`text-sm ${feedback.type === 'error' ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}
                >
                  {feedback.message}
                </p>
              )}
            </div>
            <button
              type='submit'
              className='rounded bg-indigo-500 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60'
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending ? 'Saving…' : 'Save All Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
