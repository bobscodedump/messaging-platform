import React, { useState } from 'react';
import { useAuth } from '../lib/auth/auth-context';
import { useCompany } from '../lib/companies/hooks';
import { Link } from 'react-router-dom';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const { data: company, isLoading } = useCompany(companyId);

  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH' | 'AGENDA'>('MONTH');

  if (isLoading) {
    return <div className="p-6">Loading calendar configuration...</div>;
  }

  const calendarId = company?.googleCalendarId;
  const timezone = company?.timezone || 'UTC';

  if (!calendarId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Calendar Not Configured</h2>
        <p className="text-gray-600 mb-4 max-w-md">
          You haven't set up a Google Calendar ID for your company yet. 
          Please configure it in your settings to view the calendar here.
        </p>
        <Link 
          to="/profile" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Go to Settings
        </Link>
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

  return (
    <div className='h-screen flex flex-col'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Calendar</h1>
            <p className='text-sm text-gray-600 mt-1'>View and manage your appointments</p>
          </div>

          <div className='flex gap-3'>
            {/* Create Event Button */}
            <button
              onClick={handleCreateEvent}
              className='px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium'
            >
              + Create Event
            </button>

            {/* View Mode Toggle */}
            <div className='flex gap-2'>
              <button
                onClick={() => setViewMode('AGENDA')}
                className={`px-3 py-1.5 text-sm rounded ${
                  viewMode === 'AGENDA' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Agenda
              </button>
              <button
                onClick={() => setViewMode('WEEK')}
                className={`px-3 py-1.5 text-sm rounded ${
                  viewMode === 'WEEK' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('MONTH')}
                className={`px-3 py-1.5 text-sm rounded ${
                  viewMode === 'MONTH' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Embed */}
      <div className='flex-1 p-6'>
        <div className='h-full bg-white rounded-lg shadow-sm border overflow-hidden'>
          <iframe
            key={viewMode} // Force re-render when view mode changes
            src={calendarEmbedUrl}
            style={{ border: 0 }}
            width='100%'
            height='100%'
            frameBorder='0'
            scrolling='no'
            title='Google Calendar'
            className='w-full h-full'
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
