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
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './lib/auth/auth-context';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className='p-6 text-sm text-neutral-500'>Loading…</div>;
  if (!user) return <Navigate to='/login' replace />;
  return <>{children}</>;
}

function NavBar() {
  const { user, logout } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return (
    <div className='mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between text-sm'>
      <div className='flex gap-4'>
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
        {/* <span className='text-neutral-400'>|</span> */}
        {/* <Link to='/messages/new' className='text-white hover:underline'>
          Send Message
        </Link> */}
        <span className='text-neutral-400'>|</span>
        <Link to='/schedules/new' className='text-white hover:underline'>
          New Schedule
        </Link>
        <span className='text-neutral-400'>|</span>
        <Link to='/profile' className='text-white hover:underline'>
          Profile
        </Link>
      </div>
      {user ? (
        <div className='flex items-center gap-3'>
          <span className='hidden sm:flex flex-col text-xs text-neutral-400'>
            <span className='font-medium text-neutral-200'>{displayName || user.email}</span>
            <span className='text-neutral-500'>{user.email}</span>
          </span>
          <button
            onClick={logout}
            className='rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800'
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

const el = document.getElementById('root');
if (el) {
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <NavBar />
            <Routes>
              <Route path='/' element={<Navigate to='/contacts' replace />} />
              <Route path='/login' element={<LoginPage />} />
              <Route
                path='/contacts'
                element={
                  <Protected>
                    <ContactsPage />
                  </Protected>
                }
              />
              <Route
                path='/groups'
                element={
                  <Protected>
                    <GroupsPage />
                  </Protected>
                }
              />
              <Route
                path='/templates'
                element={
                  <Protected>
                    <TemplatesPage />
                  </Protected>
                }
              />
              <Route
                path='/messages/new'
                element={
                  <Protected>
                    <SendMessagePage />
                  </Protected>
                }
              />
              <Route
                path='/schedules/new'
                element={
                  <Protected>
                    <SchedulesPage />
                  </Protected>
                }
              />
              <Route
                path='/profile'
                element={
                  <Protected>
                    <ProfilePage />
                  </Protected>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
} else {
  throw new Error('Could not find root element');
}
