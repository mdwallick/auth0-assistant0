
'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/utils/cn';
import { ServiceAuthPanel } from './ServiceAuthPanel';

export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <Link
      href={props.href}
      className={cn(
        'px-4 py-2 rounded-[18px] whitespace-nowrap flex items-center gap-2 text-sm transition-all',
        pathname === props.href && 'bg-primary text-primary-foreground',
      )}
    >
      {props.children}
    </Link>
  );
};

export function Navbar() {
  const clearChat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatHistory');
      window.location.reload();
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <Image src="/images/auth0-ai-logo.svg" alt="Auth0 AI Logo" width={32} height={32} />
        <span className="text-xl font-semibold">Assistant0</span>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={clearChat}>
          New Chat
        </Button>
        <ServiceAuthPanel />
      </div>
    </nav>
  )
}
