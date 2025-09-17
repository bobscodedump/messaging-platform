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
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400'>
            {leftIcon}
          </div>
        ) : null}
        <input
          ref={ref}
          className={[
            'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500',
            leftIcon ? 'pl-9' : '',
            rightIcon ? 'pr-9' : '',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
          ].join(' ')}
          {...props}
        />
        {rightIcon ? (
          <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400'>
            {rightIcon}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
