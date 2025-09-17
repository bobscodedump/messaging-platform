import React from 'react';

type CardProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export default function Card({ title, description, children, footer, className }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
        className ?? '',
      ].join(' ')}
    >
      {title || description ? (
        <div className='mb-4'>
          {title ? (
            typeof title === 'string' ? (
              <h3 className='text-lg font-semibold text-neutral-900 dark:text-neutral-100'>{title}</h3>
            ) : (
              <div>{title}</div>
            )
          ) : null}
          {description ? (
            typeof description === 'string' ? (
              <p className='mt-1 text-sm text-neutral-600 dark:text-neutral-400'>{description}</p>
            ) : (
              <div className='mt-1 text-sm text-neutral-600 dark:text-neutral-400'>{description}</div>
            )
          ) : null}
        </div>
      ) : null}
      <div className='space-y-4'>{children}</div>
      {footer ? <div className='mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800'>{footer}</div> : null}
    </div>
  );
}
