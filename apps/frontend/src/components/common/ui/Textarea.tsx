import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export default function Textarea({ className, error, ...props }: TextareaProps) {
  return (
    <textarea
      className={[
        'w-full rounded-lg border border-input bg-white/90 px-4 py-3 text-sm text-foreground shadow-sm transition-all duration-150 placeholder:text-muted-foreground/70 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        error ? 'border-destructive focus-visible:ring-destructive/70' : '',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  );
}
