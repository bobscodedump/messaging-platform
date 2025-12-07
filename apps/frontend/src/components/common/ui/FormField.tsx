import React from 'react';
import Label from './Label';
import HelperText from './HelperText';
import ErrorText from './ErrorText';

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
    <div className={['space-y-2', editingEnabled ? '' : 'opacity-60'].join(' ')} aria-disabled={!editingEnabled}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {helpText && !error ? <HelperText>{helpText}</HelperText> : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}
