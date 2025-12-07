import React from 'react';

export default function HelperText({ children }: { children: React.ReactNode }) {
  return <p className='mt-1 text-[0.85rem] leading-relaxed text-muted-foreground/80'>{children}</p>;
}
