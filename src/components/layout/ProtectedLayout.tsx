import { useState } from 'react';
import { TopNavigation } from './TopNavigation';
import { PinLockDialog } from '../pos/PinLockDialog';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const [isLocked, setIsLocked] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopNavigation onLockScreen={() => setIsLocked(true)} />
      <PinLockDialog open={isLocked} onUnlock={() => setIsLocked(false)} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
