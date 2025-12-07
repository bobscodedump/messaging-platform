import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../lib/auth/auth-context';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

const NAV_ITEMS = [
  { label: 'Contacts', path: '/contacts', icon: PeopleIcon },
  { label: 'Groups', path: '/groups', icon: GroupsIcon },
  { label: 'Templates', path: '/templates', icon: DescriptionIcon },
  { label: 'Send Message', path: '/messages/new', icon: SendIcon },
  { label: 'Schedules', path: '/schedules/new', icon: ScheduleIcon },
  { label: 'Calendar', path: '/calendar', icon: CalendarMonthIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'PLATFORM_ADMIN' || user?.role === 'COMPANY_ADMIN';

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className='fixed inset-y-0 left-0 z-50 w-64 bg-surface text-surface-foreground transition-transform duration-300 ease-in-out border-r border-border'>
      {/* Logo / Brand */}
      <div className='flex h-16 items-center justify-center border-b border-surface-foreground/10 bg-surface px-6'>
        <h1 className='text-xl font-bold tracking-wider text-primary'>MESSAGING</h1>
      </div>

      {/* Navigation */}
      <nav className='flex-1 space-y-1 px-3 py-4'>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-surface-foreground/70 hover:bg-surface-foreground/10 hover:text-surface-foreground'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  active ? 'text-primary-foreground' : 'text-surface-foreground/50 group-hover:text-surface-foreground'
                }`}
              />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className='my-4 border-t border-surface-foreground/10 mx-3' />
            <div className='px-3 text-xs font-semibold uppercase tracking-wider text-surface-foreground/50 mb-2'>
              Admin
            </div>
            <Link
              to='/users'
              className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive('/users')
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-surface-foreground/70 hover:bg-surface-foreground/10 hover:text-surface-foreground'
              }`}
            >
              <AdminPanelSettingsIcon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive('/users')
                    ? 'text-primary-foreground'
                    : 'text-surface-foreground/50 group-hover:text-surface-foreground'
                }`}
              />
              User Management
            </Link>
          </>
        )}
      </nav>

      {/* User Profile / Bottom Actions */}
      <div className='border-t border-surface-foreground/10 bg-surface p-4'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground'>
            {user?.firstName?.[0] || user?.email?.[0] || 'U'}
          </div>
          <div className='flex-1 overflow-hidden'>
            <p className='truncate text-sm font-medium text-surface-foreground'>
              {user?.firstName} {user?.lastName}
            </p>
            <p className='truncate text-xs text-surface-foreground/70'>{user?.email}</p>
          </div>
        </div>
        <div className='mt-4 flex gap-2'>
          <Link
            to='/profile'
            className='flex flex-1 items-center justify-center rounded-md border border-surface-foreground/10 bg-surface-foreground/5 py-1.5 text-xs font-medium text-surface-foreground/70 hover:bg-surface-foreground/10 hover:text-surface-foreground'
          >
            <PersonIcon className='mr-1.5 h-4 w-4' />
            Profile
          </Link>
          <button
            onClick={logout}
            className='flex flex-1 items-center justify-center rounded-md border border-surface-foreground/10 bg-surface-foreground/5 py-1.5 text-xs font-medium text-surface-foreground/70 hover:bg-red-100 hover:text-red-600 hover:border-red-200'
          >
            <LogoutIcon className='mr-1.5 h-4 w-4' />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
