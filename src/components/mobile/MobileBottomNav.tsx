import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  Tag,
  FolderKanban,
  Home,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentPath: string;
}

export function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
  const navigate = useNavigate();

  const navItems = [
    { path: '/mobile/management', icon: Home, label: 'Menu' },
    { path: '/mobile/products', icon: Package, label: 'Produits' },
    { path: '/mobile/orders', icon: ShoppingCart, label: 'Commandes' },
    { path: '/mobile/promotions', icon: Tag, label: 'Promos' },
    { path: '/mobile/categories', icon: FolderKanban, label: 'Catégories' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-area-inset-bottom">
      <div className="flex items-center justify-around p-1.5 sm:p-2 max-w-7xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.path)}
              className="flex-col h-auto py-1.5 sm:py-2 px-2 sm:px-3 gap-0.5 sm:gap-1 min-w-0"
            >
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] sm:text-xs truncate ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
