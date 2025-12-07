import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'muted'
  | 'destructive'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

const baseClasses =
  'inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground/70 transition-colors duration-200';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted/70 text-muted-foreground',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  secondary: 'border-secondary/15 bg-secondary/10 text-secondary-foreground',
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/15 text-warning-foreground',
  info: 'border-info/20 bg-info/10 text-info',
  muted: 'border-border/60 bg-white/30 text-foreground/60',
  destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
  outline: 'border-border bg-transparent text-foreground',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3.5 py-1 text-xs',
};

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  leadingIcon?: React.ReactNode;
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', leadingIcon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={classNames(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {leadingIcon ? <span className='text-xs'>{leadingIcon}</span> : null}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
