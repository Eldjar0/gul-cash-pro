import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Moon, Sun } from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { toast } from 'sonner';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBottomNav?: boolean;
}

export function MobileLayout({ children, title, showBottomNav = true }: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const weather = useWeather();
  const { signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mobile-dark-mode');
    return saved === 'true';
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mobile-dark-mode', darkMode.toString());
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnexion réussie');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h1 className="text-2xl font-black">{title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{currentTime.toLocaleTimeString('fr-FR')}</span>
              {weather && !weather.loading && (
                <>
                  <span>•</span>
                  <span>{weather.temperature}°C</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={showBottomNav ? 'pb-20' : 'pb-4'}>
        {children}
      </div>

      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav currentPath={location.pathname} />}
    </div>
  );
}
