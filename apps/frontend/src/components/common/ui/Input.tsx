import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className={`relative ${className ?? ''}`}>
        {leftIcon ? (
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground'>
            {leftIcon}
          </div>
        ) : null}
        <input
          ref={ref}
          className={[
            'flex h-11 w-full rounded-lg border border-input bg-white/90 px-4 py-2 text-sm text-foreground shadow-sm transition-all duration-150 placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
            leftIcon ? 'pl-11' : '',
            rightIcon ? 'pr-11' : '',
            error ? 'border-destructive focus-visible:ring-destructive/70' : '',
          ].join(' ')}
          {...props}
        />
        {rightIcon ? (
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground'>
            {rightIcon}
          </div>
        ) : null}
        {error && <p className='mt-1 text-xs font-medium text-destructive'>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
