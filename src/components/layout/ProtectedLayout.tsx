import { useState, useEffect } from 'react';
import { TopNavigation } from './TopNavigation';
import { PinLockDialog } from '../pos/PinLockDialog';
import { useStockAlerts } from '@/hooks/useStockAlerts';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const [isLocked, setIsLocked] = useState(false);
  
  // Monitor stock levels and create alerts
  useStockAlerts();

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
