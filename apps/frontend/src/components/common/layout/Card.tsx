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
    <div className={['rounded-xl border border-border bg-card p-6 shadow-sm', className ?? ''].join(' ')}>
      {title || description ? (
        <div className='mb-4'>
          {title ? (
            typeof title === 'string' ? (
              <h3 className='text-lg font-semibold text-card-foreground'>{title}</h3>
            ) : (
              <div>{title}</div>
            )
          ) : null}
          {description ? (
            typeof description === 'string' ? (
              <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
            ) : (
              <div className='mt-1 text-sm text-muted-foreground'>{description}</div>
            )
          ) : null}
        </div>
      ) : null}
      <div className='space-y-4'>{children}</div>
      {footer ? <div className='mt-6 border-t border-border pt-4'>{footer}</div> : null}
    </div>
  );
}
