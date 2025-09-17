import React from 'react';

type SectionProps = {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export default function Section({ title, children, actions, className }: SectionProps) {
  return (
    <section className={['w-full', className ?? ''].join(' ')}>
      {(title || actions) && (
        <div className='mb-3 flex items-center justify-between'>
          {title ? (
            <h2 className='text-base font-semibold text-neutral-900 dark:text-neutral-100'>{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
