import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Package, ExternalLink } from 'lucide-react';
import {
  useCustomerSpecialPrices,
} from '@/hooks/useCustomerSpecialPrices';

interface MobileCustomerSpecialPricesProps {
  customerId: string;
}

export function MobileCustomerSpecialPrices({ customerId }: MobileCustomerSpecialPricesProps) {
  const navigate = useNavigate();
  const { data: specialPrices = [] } = useCustomerSpecialPrices(customerId);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Prix spéciaux</h3>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/mobile/customer/${customerId}/special-prices`)}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Voir tout
        </Button>
      </div>

      <div className="text-center py-4">
        {specialPrices.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            Aucun prix spécial configuré
          </div>
        ) : (
          <div>
            <div className="text-3xl font-bold text-primary mb-1">
              {specialPrices.length}
            </div>
            <p className="text-sm text-muted-foreground">
              {specialPrices.length === 1 ? 'produit avec prix spécial' : 'produits avec prix spéciaux'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
