'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import SessionModal from './SessionModal';

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setWasAuthenticated(true);
    }
    
    if (status === 'unauthenticated' && wasAuthenticated) {
      const isManualLogout = localStorage.getItem('manual_logout');
      if (!isManualLogout) {
        setShowModal(true);
      }
      localStorage.removeItem('manual_logout');
    }
  }, [status, wasAuthenticated]);

  return (
    <>
      {children}
      <SessionModal isOpen={showModal} />
    </>
  );
}
