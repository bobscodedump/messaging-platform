import React from 'react';

export default function HelperText({ children }: { children: React.ReactNode }) {
  return <p className='text-xs text-neutral-500'>{children}</p>;
}
