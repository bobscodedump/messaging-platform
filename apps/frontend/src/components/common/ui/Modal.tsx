import { ReactNode, useEffect, useId } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const headingId = useId();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6'>
      <div
        className='absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={headingId}
        className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto rounded-2xl border border-white/25 bg-white/95 text-foreground shadow-[0_45px_130px_rgba(15,23,42,0.22)] ring-1 ring-black/5`}
      >
        <div className='flex items-center justify-between border-b border-white/40 px-6 py-5'>
          <h2 id={headingId} className='text-lg font-semibold text-foreground'>
            {title}
          </h2>
          <button
            onClick={onClose}
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-muted/40 text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-white'
            aria-label='Close'
          >
            <svg
              className='h-5 w-5'
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='px-6 py-5'>{children}</div>
      </div>
    </div>
  );
}
