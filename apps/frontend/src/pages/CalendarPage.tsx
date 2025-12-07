import React, { useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import { useCompany } from '../lib/companies/hooks';
import { Link } from 'react-router-dom';
import Button from '../components/common/ui/Button';
import Card from '../components/common/layout/Card';
import { Badge } from '../components/common/ui/Badge';

type ViewMode = 'WEEK' | 'MONTH' | 'AGENDA';

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: 'AGENDA', label: 'Agenda' },
  { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' },
];

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const { data: company, isLoading } = useCompany(companyId);

  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');

  if (isLoading) {
    return (
      <div className='mx-auto max-w-7xl p-4 text-sm text-muted-foreground sm:p-6'>
        Loading calendar configuration...
      </div>
    );
  }

  const calendarId = company?.googleCalendarId;
  const timezone = company?.timezone || 'UTC';

  if (!calendarId) {
    return (
      <div className='mx-auto max-w-7xl p-4 sm:p-6'>
        <Card
          title='Calendar'
          description='Connect Google Calendar to visualize and manage appointments side-by-side with messaging workflows.'
          className='mx-auto max-w-3xl'
        >
          <div className='flex flex-col items-center justify-center gap-4 text-center'>
            <p className='max-w-md text-sm text-muted-foreground'>
              Add your Google Calendar ID inside Profile → Company Settings to embed events and switch between views
              without leaving the dashboard.
            </p>
            <Link to='/profile'>
              <Button variant='primary'>Go to Settings</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Build the calendar embed URL
  const calendarEmbedUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}&ctz=${timezone}&mode=${viewMode}&showTitle=0&showNav=1&showPrint=0&showTabs=0&showCalendars=0`;

  // Function to open Google Calendar event creation
  const handleCreateEvent = () => {
    const createEventUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?src=${encodeURIComponent(calendarId)}`;
    window.open(createEventUrl, '_blank');
  };

  const calendarLabel = calendarId.length > 40 ? `${calendarId.slice(0, 37)}…` : calendarId;

  return (
    <div className='mx-auto max-w-7xl space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
            <Badge variant='muted' size='sm'>
              Engagement tools
            </Badge>
            <span>Calendar</span>
          </div>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>Upcoming schedule</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Stay in sync with every appointment across your workspace.
            </p>
          </div>
          <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
            <span className='rounded-full bg-muted/60 px-3 py-1 font-medium text-muted-foreground/90'>
              Timezone: {timezone}
            </span>
            <span className='rounded-full bg-muted/40 px-3 py-1 font-medium text-muted-foreground/80'>
              Calendar: {calendarLabel}
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
          <div className='flex flex-1 gap-1 rounded-full border border-border/70 bg-card/90 p-1 shadow-inner sm:flex-none'>
            {VIEW_OPTIONS.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  viewMode === mode.value
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <Button onClick={handleCreateEvent} className='w-full sm:w-auto'>
            + Create Event
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden border-border/80 bg-card/95 p-0 shadow-lg'>
        <div className='min-h-[70vh] w-full'>
          <iframe
            key={viewMode}
            src={calendarEmbedUrl}
            style={{ border: 0 }}
            width='100%'
            height='100%'
            frameBorder='0'
            scrolling='no'
            title='Google Calendar'
            className='h-[70vh] w-full'
          />
        </div>
      </Card>
    </div>
  );
};

export default CalendarPage;
