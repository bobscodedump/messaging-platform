import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[calc(var(--radius)*1.3)] border border-white/40 bg-white/90 text-card-foreground shadow-[0_35px_90px_rgba(15,23,42,0.08)] backdrop-blur-md ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = '', ...props }: CardProps) {
  return (
    <div className={`flex flex-col gap-2 border-b border-white/50 bg-white/40 p-6 sm:p-8 ${className}`} {...props} />
  );
}

export function CardTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-2xl font-semibold leading-tight text-foreground ${className}`} {...props} />;
}

export function CardDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-[0.95rem] leading-relaxed text-muted-foreground/85 ${className}`} {...props} />;
}

export function CardContent({ className = '', ...props }: CardProps) {
  return <div className={`p-6 sm:p-7 ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: CardProps) {
  return <div className={`flex items-center border-t border-white/50 p-6 sm:p-7 ${className}`} {...props} />;
}
