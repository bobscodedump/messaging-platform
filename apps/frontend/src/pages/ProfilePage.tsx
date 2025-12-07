import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import { useUserProfile, useUpdateUser } from '../lib/users/hooks';
import { useCompany, useUpdateCompany } from '../lib/companies/hooks';
import Button from '../components/common/ui/Button';
import Input from '../components/common/ui/Input';
import Label from '../components/common/ui/Label';
import Select from '../components/common/ui/Select';
import Card from '../components/common/layout/Card';

// Common timezones for the dropdown
const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Chicago', label: 'America/Chicago' },
  { value: 'America/Denver', label: 'America/Denver' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland' },
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
    <div className='mx-auto max-w-5xl space-y-8 p-4 sm:p-6'>
      <div>
        <h1 className='text-2xl font-semibold text-slate-900'>Profile & Settings</h1>
        <p className='text-sm text-slate-600'>Manage your personal information and company configuration.</p>
      </div>

      {/* User Profile Section */}
      <Card
        title='Your Profile'
        description='Update the information associated with your account.'
        action={userLoading && <span className='text-xs text-slate-500'>Loading…</span>}
      >
        {userError ? (
          <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
            {(userErrorObj as Error)?.message || 'Failed to load user information'}
          </div>
        ) : (
          <form className='grid gap-6 sm:grid-cols-2' onSubmit={handleUserSubmit}>
            <div>
              <Label htmlFor='firstName'>First Name</Label>
              <Input
                id='firstName'
                type='text'
                value={userForm.firstName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, firstName: event.target.value }))}
                required
                disabled={updateUserMutation.isPending}
                className='w-full'
              />
            </div>
            <div>
              <Label htmlFor='lastName'>Last Name</Label>
              <Input
                id='lastName'
                type='text'
                value={userForm.lastName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, lastName: event.target.value }))}
                required
                disabled={updateUserMutation.isPending}
                className='w-full'
              />
            </div>
            <div className='sm:col-span-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={userForm.email}
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                disabled={updateUserMutation.isPending}
                className='w-full'
              />
            </div>
            <div className='flex items-center justify-between pt-2 sm:col-span-2'>
              <span className='text-sm text-slate-500'>
                Role: <span className='font-medium text-slate-700'>{userProfile?.role ?? '—'}</span>
              </span>
              <Button type='submit' loading={updateUserMutation.isPending}>
                Save Profile
              </Button>
            </div>
            {userFeedback && (
              <p
                className={`text-sm sm:col-span-2 ${updateUserMutation.isError ? 'text-red-600' : 'text-emerald-600'}`}
              >
                {userFeedback}
              </p>
            )}
          </form>
        )}
      </Card>

      {/* Company Settings Section - Only for Admins */}
      {isAdmin && (
        <>
          {companyError ? (
            <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
              {(companyErrorObj as Error)?.message || 'Failed to load company information'}
            </div>
          ) : (
            <form onSubmit={handleCompanySubmit} className='space-y-6'>
              {/* Company Info */}
              <Card
                title='Company Information'
                description='Basic company details visible to your team.'
                action={companyLoading && <span className='text-xs text-slate-500'>Loading…</span>}
              >
                <div className='grid gap-6 sm:grid-cols-2'>
                  <div className='sm:col-span-2'>
                    <Label htmlFor='companyName'>Company Name</Label>
                    <Input
                      id='companyName'
                      type='text'
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={updateCompanyMutation.isPending}
                      className='w-full'
                    />
                  </div>
                  <div className='text-sm text-slate-500 sm:col-span-2'>
                    Company ID:{' '}
                    <code className='rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-700'>
                      {company?.id ?? '—'}
                    </code>
                  </div>
                </div>
              </Card>

              {/* WhatsApp Configuration */}
              <Card
                title='WhatsApp Configuration'
                description='Configure your WaSender API integration for sending WhatsApp messages'
              >
                <div className='grid gap-6 sm:grid-cols-2'>
                  <div>
                    <Label htmlFor='whatsappPhone'>WhatsApp Phone Number</Label>
                    <Input
                      id='whatsappPhone'
                      type='text'
                      value={companyForm.whatsappPhone}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, whatsappPhone: e.target.value }))}
                      placeholder='+65 1234 5678'
                      disabled={updateCompanyMutation.isPending}
                      className='w-full'
                    />
                    <p className='mt-1 text-xs text-slate-500'>The phone number connected to your WhatsApp Business</p>
                  </div>
                  <div>
                    <Label htmlFor='whatsappApiKey'>WaSender API Key</Label>
                    <div className='relative'>
                      <Input
                        id='whatsappApiKey'
                        type={showApiKey ? 'text' : 'password'}
                        value={companyForm.whatsappApiKey}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, whatsappApiKey: e.target.value }))}
                        placeholder='Your API key'
                        disabled={updateCompanyMutation.isPending}
                        className='w-full pr-16'
                      />
                      <button
                        type='button'
                        onClick={() => setShowApiKey(!showApiKey)}
                        className='absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs font-medium text-blue-600 hover:text-blue-500'
                      >
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className='mt-1 text-xs text-slate-500'>Get this from your WaSender dashboard</p>
                  </div>
                  <div className='sm:col-span-2'>
                    <Label htmlFor='whatsappApiUrl'>WhatsApp API URL</Label>
                    <Input
                      id='whatsappApiUrl'
                      type='url'
                      value={companyForm.whatsappApiUrl}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, whatsappApiUrl: e.target.value }))}
                      placeholder='https://wasenderapi.com/api (default)'
                      disabled={updateCompanyMutation.isPending}
                      className='w-full'
                    />
                    <p className='mt-1 text-xs text-slate-500'>Leave blank to use default WaSender API URL</p>
                  </div>
                </div>
              </Card>

              {/* Messaging Settings */}
              <Card title='Messaging Settings' description='Configure message sending behavior'>
                <div className='grid gap-6 sm:grid-cols-2'>
                  <div>
                    <Label htmlFor='messageSendDelayMs'>Message Send Delay (ms)</Label>
                    <Input
                      id='messageSendDelayMs'
                      type='number'
                      value={companyForm.messageSendDelayMs}
                      onChange={(e) =>
                        setCompanyForm((prev) => ({ ...prev, messageSendDelayMs: parseInt(e.target.value) || 0 }))
                      }
                      min='0'
                      max='60000'
                      step='100'
                      disabled={updateCompanyMutation.isPending}
                      className='w-full'
                    />
                    <p className='mt-1 text-xs text-slate-500'>
                      Delay between messages to prevent rate limiting. Default: 5000ms (5 seconds)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor='timezone'>Timezone</Label>
                    <Select
                      id='timezone'
                      value={companyForm.timezone}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, timezone: e.target.value }))}
                      options={TIMEZONES}
                      disabled={updateCompanyMutation.isPending}
                      className='w-full'
                    />
                    <p className='mt-1 text-xs text-slate-500'>Used for scheduling messages and displaying times</p>
                  </div>
                </div>
              </Card>

              {/* Calendar Integration */}
              <Card title='Calendar Integration' description='Connect your Google Calendar for appointment reminders'>
                <div className='grid gap-6'>
                  <div>
                    <Label htmlFor='googleCalendarId'>Google Calendar ID</Label>
                    <Input
                      id='googleCalendarId'
                      type='text'
                      value={companyForm.googleCalendarId}
                      onChange={(e) => setCompanyForm((prev) => ({ ...prev, googleCalendarId: e.target.value }))}
                      placeholder='your-calendar-id@group.calendar.google.com'
                      disabled={updateCompanyMutation.isPending}
                      className='w-full'
                    />
                    <p className='mt-1 text-xs text-slate-500'>
                      Find this in Google Calendar → Settings → Calendar ID. Used for n8n appointment workflows.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Submit */}
              <div className='flex items-center justify-between border-t border-slate-200 pt-4'>
                <div>
                  {companyFeedback && (
                    <p className={`text-sm ${updateCompanyMutation.isError ? 'text-red-600' : 'text-emerald-600'}`}>
                      {companyFeedback}
                    </p>
                  )}
                </div>
                <Button type='submit' loading={updateCompanyMutation.isPending}>
                  Save Company Settings
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Non-admin company info */}
      {!isAdmin && company && (
        <Card title='Your Company' description='Contact an administrator to change company settings.'>
          <div className='text-sm text-slate-600'>
            <p>
              <strong>Company:</strong> {company.name}
            </p>
            <p className='mt-1 text-xs text-slate-500'>Company ID: {company.id}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
