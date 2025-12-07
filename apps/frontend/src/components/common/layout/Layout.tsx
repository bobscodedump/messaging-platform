import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='min-h-screen bg-background'>
      <Sidebar />

      {/* Main Content Wrapper - pushed right by sidebar width (w-64 = 16rem) */}
      <div className='ml-64 flex min-h-screen flex-col transition-all duration-300'>
        <Header />

        <main className='flex-1 p-6'>
          <div className='mx-auto max-w-7xl'>{children}</div>
        </main>
      </div>
    </div>
  );
}
