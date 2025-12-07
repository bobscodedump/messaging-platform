import React from 'react';

type Option = { label: string; value: string };

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
  error?: string;
};

export default function Select({ options, className, error, ...props }: SelectProps) {
  return (
    <select
      className={[
        'w-full appearance-none rounded-lg border border-input bg-white/90 px-4 py-2.5 pr-10 text-sm text-foreground shadow-sm transition-all duration-150 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        error ? 'border-destructive focus-visible:ring-destructive/70' : '',
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
