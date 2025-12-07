import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
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
        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800'>
          <h2 className='font-medium'>Access Denied</h2>
          <p className='text-sm'>Only company administrators can access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl space-y-8 p-4 sm:p-6'>
      <div>
        <h1 className='text-2xl font-semibold text-foreground'>Company Settings</h1>
        <p className='text-sm text-muted-foreground'>
          Configure your company's WhatsApp integration, messaging behavior, and calendar settings.
        </p>
      </div>

      {companyLoading && <div className='text-sm text-muted-foreground'>Loading settings…</div>}

      {companyError && (
        <div className='rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive'>
          {(companyErrorObj as Error)?.message || 'Failed to load company settings'}
        </div>
      )}

      {!companyLoading && !companyError && (
        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Company Info Section */}
          <Card title='Company Information' description='Basic company details'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <Label htmlFor='companyName'>Company Name</Label>
                <Input
                  id='companyName'
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  disabled={updateCompanyMutation.isPending}
                  className='w-full'
                />
              </div>
              <div className='text-sm text-muted-foreground sm:col-span-2'>
                Company ID:{' '}
                <code className='rounded border border-border bg-muted px-2 py-0.5 text-foreground'>
                  {company?.id ?? '—'}
                </code>
              </div>
            </div>
          </Card>

          {/* WhatsApp Configuration Section */}
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
                  value={formData.whatsappPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappPhone: e.target.value }))}
                  placeholder='+65 1234 5678'
                  disabled={updateCompanyMutation.isPending}
                  className='w-full'
                />
                <p className='mt-1 text-xs text-muted-foreground'>
                  The phone number connected to your WhatsApp Business
                </p>
              </div>
              <div>
                <Label htmlFor='whatsappApiKey'>WaSender API Key</Label>
                <div className='relative'>
                  <Input
                    id='whatsappApiKey'
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.whatsappApiKey}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsappApiKey: e.target.value }))}
                    placeholder='Your API key'
                    disabled={updateCompanyMutation.isPending}
                    className='w-full pr-16'
                  />
                  <button
                    type='button'
                    onClick={() => setShowApiKey(!showApiKey)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 px-2 text-xs font-medium text-primary hover:text-primary/80'
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Get this from your WaSender dashboard</p>
              </div>
              <div className='sm:col-span-2'>
                <Label htmlFor='whatsappApiUrl'>WhatsApp API URL</Label>
                <Input
                  id='whatsappApiUrl'
                  type='url'
                  value={formData.whatsappApiUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappApiUrl: e.target.value }))}
                  placeholder='https://wasenderapi.com/api (default)'
                  disabled={updateCompanyMutation.isPending}
                  className='w-full'
                />
                <p className='mt-1 text-xs text-muted-foreground'>Leave blank to use default WaSender API URL</p>
              </div>
            </div>
          </Card>

          {/* Messaging Settings Section */}
          <Card title='Messaging Settings' description='Configure message sending behavior'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <Label htmlFor='messageSendDelayMs'>Message Send Delay (ms)</Label>
                <Input
                  id='messageSendDelayMs'
                  type='number'
                  value={formData.messageSendDelayMs}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, messageSendDelayMs: parseInt(e.target.value) || 0 }))
                  }
                  min='0'
                  max='60000'
                  step='100'
                  disabled={updateCompanyMutation.isPending}
                  className='w-full'
                />
                <p className='mt-1 text-xs text-muted-foreground'>
                  Delay between sending messages to prevent rate limiting. Default: 5000ms (5 seconds)
                </p>
              </div>
              <div>
                <Label htmlFor='timezone'>Timezone</Label>
                <Select
                  id='timezone'
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  options={TIMEZONES}
                  disabled={updateCompanyMutation.isPending}
                  className='w-full'
                />
                <p className='mt-1 text-xs text-muted-foreground'>Used for scheduling messages and displaying times</p>
              </div>
            </div>
          </Card>

          {/* Calendar Integration Section */}
          <Card title='Calendar Integration' description='Connect your Google Calendar for appointment reminders'>
            <div className='grid gap-6'>
              <div>
                <Label htmlFor='googleCalendarId'>Google Calendar ID</Label>
                <Input
                  id='googleCalendarId'
                  type='text'
                  value={formData.googleCalendarId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, googleCalendarId: e.target.value }))}
                  placeholder='your-calendar-id@group.calendar.google.com'
                  disabled={updateCompanyMutation.isPending}
                  className='w-full'
                />
                <p className='mt-1 text-xs text-muted-foreground'>
                  Find this in Google Calendar → Settings → Calendar ID. Used for n8n appointment reminder workflows.
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Section */}
          <div className='flex items-center justify-between border-t border-border pt-4'>
            <div>
              {feedback && (
                <p className={`text-sm ${feedback.type === 'error' ? 'text-destructive' : 'text-success'}`}>
                  {feedback.message}
                </p>
              )}
            </div>
            <Button type='submit' loading={updateCompanyMutation.isPending}>
              Save All Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
