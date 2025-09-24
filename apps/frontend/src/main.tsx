import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/api/query-client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import ContactsPage from './pages/ContactsPage';
import GroupsPage from './pages/GroupsPage';
import TemplatesPage from './pages/TemplatesPage';
import SendMessagePage from './pages/SendMessagePage';
import SchedulesPage from './pages/SchedulesPage';

const el = document.getElementById('root');
if (el) {
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 py-4 flex gap-4 text-sm'>
            <Link to='/contacts' className='text-white hover:underline'>
              Contacts
            </Link>
            <span className='text-neutral-400'>|</span>
            <Link to='/groups' className='text-white hover:underline'>
              Groups
            </Link>
            <span className='text-neutral-400'>|</span>
            <Link to='/templates' className='text-white hover:underline'>
              Templates
            </Link>
            <span className='text-neutral-400'>|</span>
            <Link to='/messages/new' className='text-white hover:underline'>
              Send Message
            </Link>
            <span className='text-neutral-400'>|</span>
            <Link to='/schedules/new' className='text-white hover:underline'>
              New Schedule
            </Link>
          </div>
          <Routes>
            <Route path='/' element={<Navigate to='/contacts' replace />} />
            <Route path='/contacts' element={<ContactsPage />} />
            <Route path='/groups' element={<GroupsPage />} />
            <Route path='/templates' element={<TemplatesPage />} />
            <Route path='/messages/new' element={<SendMessagePage />} />
            <Route path='/schedules/new' element={<SchedulesPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
} else {
  throw new Error('Could not find root element');
}
