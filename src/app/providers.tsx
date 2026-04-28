'use client';
import { SessionProvider } from 'next-auth/react';
import SessionGuard from '@/components/SessionGuard';
import PinGuard from '@/components/PinGuard';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard>
        <PinGuard>
          {children}
        </PinGuard>
      </SessionGuard>
    </SessionProvider>
  );
}

