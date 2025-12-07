import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

// Simple classNames helper if not imported
function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const base =
  'group inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-all duration-150 ease-out ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95',
  secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 active:bg-secondary/95',
  outline: 'border border-border bg-transparent text-foreground hover:bg-foreground/5 active:bg-foreground/10',
  ghost: 'text-muted-foreground hover:bg-muted/60 active:bg-muted/70',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/95',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5 rounded-xl',
  icon: 'h-10 w-10 rounded-full px-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        data-variant={variant}
        {...props}
      >
        {loading ? (
          <span className='inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current/80' />
        ) : leftIcon ? (
          <span className='inline-flex h-4 w-4 items-center justify-center'>{leftIcon}</span>
        ) : null}

        <span className='flex items-center gap-1'>{children}</span>

        {rightIcon ? <span className='inline-flex h-4 w-4 items-center justify-center'>{rightIcon}</span> : null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
