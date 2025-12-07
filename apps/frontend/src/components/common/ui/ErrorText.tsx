import React from 'react';

export default function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className='mt-1 text-[0.85rem] font-medium leading-relaxed text-destructive'>{children}</p>;
}
