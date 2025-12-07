import React from 'react';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export default function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      className={['mb-1 inline-flex items-center gap-1 text-sm font-medium text-foreground/80', className ?? ''].join(
        ' '
      )}
      {...props}
    >
      {children}
      {required ? <span className='text-destructive'>*</span> : null}
    </label>
  );
}
