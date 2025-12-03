import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import { useUserProfile, useUpdateUser } from '../lib/users/hooks';
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

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const userId = user?.id;
  const companyId = user?.companyId;
  const isAdmin = user?.role === 'PLATFORM_ADMIN' || user?.role === 'COMPANY_ADMIN';

  const { data: userProfile, isLoading: userLoading, isError: userError, error: userErrorObj } = useUserProfile(userId);
  const {
    data: company,
    isLoading: companyLoading,
    isError: companyError,
    error: companyErrorObj,
  } = useCompany(companyId);

  const updateUserMutation = useUpdateUser(userId);
  const updateCompanyMutation = useUpdateCompany(companyId);

  const [userForm, setUserForm] = useState({ firstName: '', lastName: '', email: '' });
  const [companyForm, setCompanyForm] = useState({
    name: '',
    whatsappPhone: '',
    whatsappApiKey: '',
    whatsappApiUrl: '',
    messageSendDelayMs: 5000,
    timezone: 'Asia/Singapore',
    googleCalendarId: '',
  });
  const [userFeedback, setUserFeedback] = useState<string | null>(null);
  const [companyFeedback, setCompanyFeedback] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setUserForm({
        firstName: userProfile.firstName ?? '',
        lastName: userProfile.lastName ?? '',
        email: userProfile.email ?? '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (company) {
      setCompanyForm({
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

  const handleUserSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;
    setUserFeedback(null);
    try {
      await updateUserMutation.mutateAsync({
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
      });
      await refreshUser();
      setUserFeedback('Profile updated successfully.');
    } catch (error) {
      setUserFeedback(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleCompanySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!companyId) return;
    setCompanyFeedback(null);
    try {
      await updateCompanyMutation.mutateAsync({
        name: companyForm.name,
        whatsappPhone: companyForm.whatsappPhone || null,
        whatsappApiKey: companyForm.whatsappApiKey || null,
        whatsappApiUrl: companyForm.whatsappApiUrl || null,
        messageSendDelayMs: companyForm.messageSendDelayMs,
        timezone: companyForm.timezone,
        googleCalendarId: companyForm.googleCalendarId || null,
      });
      setCompanyFeedback('Company settings updated successfully.');
    } catch (error) {
      setCompanyFeedback(error instanceof Error ? error.message : 'Failed to update company settings');
    }
  };

  return (
    <div className='mx-auto max-w-5xl p-4 sm:p-6 space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold text-neutral-900 dark:text-white'>Profile & Settings</h1>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>
          Manage your personal information and company configuration.
        </p>
      </div>

      {/* User Profile Section */}
      <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
        <header className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Your Profile</h2>
            <p className='text-xs text-neutral-500'>Update the information associated with your account.</p>
          </div>
          {userLoading && <span className='text-xs text-neutral-500'>Loading…</span>}
        </header>
        {userError ? (
          <div className='rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200'>
            {(userErrorObj as Error)?.message || 'Failed to load user information'}
          </div>
        ) : (
          <form className='grid gap-4 sm:grid-cols-2' onSubmit={handleUserSubmit}>
            <label className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>First name</span>
              <input
                type='text'
                value={userForm.firstName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, firstName: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateUserMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>Last name</span>
              <input
                type='text'
                value={userForm.lastName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, lastName: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateUserMutation.isPending}
              />
            </label>
            <label className='flex flex-col gap-1 sm:col-span-2'>
              <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>Email</span>
              <input
                type='email'
                value={userForm.email}
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                required
                disabled={updateUserMutation.isPending}
              />
            </label>
            <div className='sm:col-span-2 flex items-center justify-between text-xs text-neutral-500'>
              <span>Role: {userProfile?.role ?? '—'}</span>
              <button
                type='submit'
                className='rounded bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60'
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
            {userFeedback && (
              <p
                className={`sm:col-span-2 text-sm ${updateUserMutation.isError ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}
              >
                {userFeedback}
              </p>
            )}
          </form>
        )}
      </section>

      {/* Company Settings Section - Only for Admins */}
      {isAdmin && (
        <>
          {companyError ? (
            <div className='rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200'>
              {(companyErrorObj as Error)?.message || 'Failed to load company information'}
            </div>
          ) : (
            <form onSubmit={handleCompanySubmit} className='space-y-6'>
              {/* Company Info */}
              <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
                <header className='mb-4 flex items-center justify-between'>
                  <div>
                    <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Company Information</h2>
                    <p className='text-xs text-neutral-500'>Basic company details visible to your team.</p>
                  </div>
                  {companyLoading && <span className='text-xs text-neutral-500'>Loading…</span>}
                </header>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <label className='flex flex-col gap-1 sm:col-span-2'>
                    <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                      Company Name
                    </span>
                    <input
                      type='text'
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))}
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

              {/* WhatsApp Configuration */}
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
                      value={companyForm.whatsappPhone}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, whatsappPhone: e.target.value }))}
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
                        value={companyForm.whatsappApiKey}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, whatsappApiKey: e.target.value }))}
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
                      value={companyForm.whatsappApiUrl}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, whatsappApiUrl: e.target.value }))}
                      className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                      placeholder='https://wasenderapi.com/api (default)'
                      disabled={updateCompanyMutation.isPending}
                    />
                    <span className='text-xs text-neutral-400'>Leave blank to use default WaSender API URL</span>
                  </label>
                </div>
              </section>

              {/* Messaging Settings */}
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
                      value={companyForm.messageSendDelayMs}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, messageSendDelayMs: parseInt(e.target.value) || 0 }))}
                      className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                      min='0'
                      max='60000'
                      step='100'
                      disabled={updateCompanyMutation.isPending}
                    />
                    <span className='text-xs text-neutral-400'>
                      Delay between messages to prevent rate limiting. Default: 5000ms (5 seconds)
                    </span>
                  </label>
                  <label className='flex flex-col gap-1'>
                    <span className='text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400'>
                      Timezone
                    </span>
                    <select
                      value={companyForm.timezone}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, timezone: e.target.value }))}
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

              {/* Calendar Integration */}
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
                      value={companyForm.googleCalendarId}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, googleCalendarId: e.target.value }))}
                      className='rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
                      placeholder='your-calendar-id@group.calendar.google.com'
                      disabled={updateCompanyMutation.isPending}
                    />
                    <span className='text-xs text-neutral-400'>
                      Find this in Google Calendar → Settings → Calendar ID. Used for n8n appointment workflows.
                    </span>
                  </label>
                </div>
              </section>

              {/* Submit */}
              <div className='flex items-center justify-between'>
                <div>
                  {companyFeedback && (
                    <p
                      className={`text-sm ${updateCompanyMutation.isError ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}
                    >
                      {companyFeedback}
                    </p>
                  )}
                </div>
                <button
                  type='submit'
                  className='rounded bg-indigo-500 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60'
                  disabled={updateCompanyMutation.isPending}
                >
                  {updateCompanyMutation.isPending ? 'Saving…' : 'Save Company Settings'}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Non-admin company info */}
      {!isAdmin && company && (
        <section className='rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-6 shadow-sm'>
          <header className='mb-4'>
            <h2 className='text-lg font-medium text-neutral-900 dark:text-white'>Your Company</h2>
            <p className='text-xs text-neutral-500'>Contact an administrator to change company settings.</p>
          </header>
          <div className='text-sm text-neutral-600 dark:text-neutral-300'>
            <p><strong>Company:</strong> {company.name}</p>
            <p className='text-xs text-neutral-500 mt-1'>Company ID: {company.id}</p>
          </div>
        </section>
      )}
    </div>
  );
}
