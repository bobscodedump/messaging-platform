import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/contacts': 'Contacts',
  '/groups': 'Groups',
  '/templates': 'Templates',
  '/messages/new': 'Send Message',
  '/schedules/new': 'Schedules',
  '/calendar': 'Calendar',
  '/users': 'User Management',
  '/profile': 'Profile & Settings',
};

export default function Header() {
  const location = useLocation();

  // Simple logic to find the title based on the current path
  const currentPath = Object.keys(PAGE_TITLES).find((path) => location.pathname.startsWith(path)) || '';
  const title = PAGE_TITLES[currentPath] || 'Dashboard';

  return (
    <header className='sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-[hsl(var(--card))] px-6 shadow-md'>
      <div className='flex items-center gap-4'>
        <h2 className='text-lg font-semibold text-foreground'>{title}</h2>
      </div>

      <div className='flex items-center gap-4'>
        {/* Placeholder for future global actions like Notifications or Help */}
        <button className='text-sm font-medium text-muted-foreground hover:text-foreground'>
          Help & Documentation
        </button>
      </div>
    </header>
  );
}
