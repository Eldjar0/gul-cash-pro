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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={goBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              {title || getBreadcrumb()}
            </h1>
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pb-safe">
        {children}
      </div>
    </div>
  );
};
