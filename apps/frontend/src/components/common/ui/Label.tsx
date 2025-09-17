import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export default function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      className={[
        'mb-1 inline-flex items-center gap-1 text-sm font-medium text-neutral-700 dark:text-neutral-300',
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {children}
      {required ? <span className='text-red-600'>*</span> : null}
    </label>
  );
}
