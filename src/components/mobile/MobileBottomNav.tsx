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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate(item.path)}
              className="flex-col h-auto py-2 px-3 gap-1"
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className={`text-xs ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
