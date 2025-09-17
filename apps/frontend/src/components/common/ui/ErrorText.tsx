import React from 'react';

export default function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className='text-xs text-red-600'>{children}</p>;
}
