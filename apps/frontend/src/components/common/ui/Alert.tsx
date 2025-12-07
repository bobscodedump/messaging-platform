import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'destructive' | 'muted';

const variantStyles: Record<AlertVariant, string> = {
  info: 'border-info/40 bg-info/10 text-info-foreground',
  success: 'border-success/35 bg-success/10 text-success',
  warning: 'border-warning/35 bg-warning/15 text-warning-foreground',
  destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
  muted: 'border-border/60 bg-muted/30 text-muted-foreground',
};

const iconDefaults: Record<AlertVariant, React.ReactNode> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  destructive: '⛔',
  muted: '💡',
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type AlertProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: AlertVariant;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function Alert({ title, description, variant = 'info', icon, className, children }: AlertProps) {
  return (
    <div
      className={classNames(
        'flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-sm shadow-[0_15px_40px_rgba(15,23,42,0.08)] backdrop-blur-md',
        variantStyles[variant],
        className
      )}
    >
      <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/75 text-base leading-none shadow-sm'>
        {icon ?? iconDefaults[variant]}
      </span>
      <div className='space-y-1'>
        {title ? <p className='font-semibold text-foreground'>{title}</p> : null}
        {description ? <p className='text-[0.95rem] text-foreground/80'>{description}</p> : null}
        {children}
      </div>
    </div>
  );
}

export default Alert;
