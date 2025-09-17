import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export default function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500',
        error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}
