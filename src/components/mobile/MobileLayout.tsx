import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMobileNavigation } from '@/hooks/useMobileNavigation';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export const MobileLayout = ({ children, title, showBack = true, actions }: MobileLayoutProps) => {
  const { goBack, getBreadcrumb } = useMobileNavigation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header responsive */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={goBack}
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">
              {title || getBreadcrumb()}
            </h1>
          </div>

          {actions && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content responsive */}
      <div className="pb-safe">
        {children}
      </div>
    </div>
  );
};
