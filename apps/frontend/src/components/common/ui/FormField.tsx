import React from 'react';
import Label from './Label';

export type FormFieldProps = {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
  editingEnabled?: boolean; // when false, dim the field visuals
};

export default function FormField({
  label,
  htmlFor,
  required,
  helpText,
  error,
  children,
  editingEnabled = true,
}: FormFieldProps) {
  return (
    <div className={['space-y-1', editingEnabled ? '' : 'opacity-60'].join(' ')} aria-disabled={!editingEnabled}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {helpText && !error ? <p className='text-xs text-neutral-500'>{helpText}</p> : null}
      {error ? <p className='text-xs text-red-600'>{error}</p> : null}
    </div>
  );
}
