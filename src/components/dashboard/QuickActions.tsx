import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  FileText, 
  Settings,
  Undo2,
  BarChart3,
  Download
} from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: ShoppingCart,
      label: 'Nouvelle vente',
      description: 'Ouvrir la caisse',
      onClick: () => navigate('/'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: Undo2,
      label: 'Remboursement',
      description: 'Créer un remboursement',
      onClick: () => navigate('/refunds'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      icon: Package,
      label: 'Produits',
      description: 'Gérer le catalogue',
      onClick: () => navigate('/products'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Users,
      label: 'Clients',
      description: 'Gérer les clients',
      onClick: () => navigate('/customers'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: FileText,
      label: 'Ventes',
      description: 'Historique des ventes',
      onClick: () => navigate('/sales'),
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      icon: BarChart3,
      label: 'Rapports',
      description: 'Rapports et stats',
      onClick: () => navigate('/reports-history'),
      color: 'bg-pink-500 hover:bg-pink-600',
    },
    {
      icon: Download,
      label: 'Sauvegarde',
      description: 'Exporter les données',
      onClick: () => navigate('/settings?tab=backup'),
      color: 'bg-teal-500 hover:bg-teal-600',
    },
    {
      icon: Settings,
      label: 'Paramètres',
      description: 'Configuration',
      onClick: () => navigate('/settings'),
      color: 'bg-gray-500 hover:bg-gray-600',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Actions Rapides</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            onClick={action.onClick}
            className="h-auto flex-col gap-2 p-4 hover:shadow-md transition-all"
          >
            <div className={`p-2 rounded-lg ${action.color} text-white`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}