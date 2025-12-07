import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/api/query-client';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ContactsPage from './pages/ContactsPage';
import GroupsPage from './pages/GroupsPage';
import TemplatesPage from './pages/TemplatesPage';
import SendMessagePage from './pages/SendMessagePage';
import SchedulesPage from './pages/SchedulesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider, useAuth } from './lib/auth/auth-context';
import Layout from './components/common/layout/Layout';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className='p-6 text-sm text-muted-foreground'>Loading…</div>;
  if (!user) return <Navigate to='/login' replace />;
  return <>{children}</>;
}

function AppLayout() {
  return (
    <Protected>
      <Layout>
        <Outlet />
      </Layout>
    </Protected>
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
            <Routes>
              <Route path='/' element={<Navigate to='/contacts' replace />} />
              <Route path='/login' element={<LoginPage />} />
              <Route path='/register' element={<RegisterPage />} />

              {/* Protected Routes with Layout */}
              <Route element={<AppLayout />}>
                <Route path='/contacts' element={<ContactsPage />} />
                <Route path='/groups' element={<GroupsPage />} />
                <Route path='/templates' element={<TemplatesPage />} />
                <Route path='/messages/new' element={<SendMessagePage />} />
                <Route path='/schedules/new' element={<SchedulesPage />} />
                <Route path='/calendar' element={<CalendarPage />} />
                <Route path='/profile' element={<ProfilePage />} />
                <Route path='/users' element={<UsersPage />} />
                <Route path='/settings' element={<SettingsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  );
} else {
  throw new Error('Could not find root element');
}
