import { useExpiringBatches } from '@/hooks/useProductBatches';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ExpiringBatchesAlert = () => {
  const { data: expiringBatches, isLoading } = useExpiringBatches(30);

  if (isLoading || !expiringBatches || expiringBatches.length === 0) return null;

  const expiredCount = expiringBatches.filter(b => 
    new Date(b.expiry_date!) < new Date()
  ).length;

  const expiringCount = expiringBatches.length - expiredCount;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Alertes Péremption</AlertTitle>
      <AlertDescription>
        <div className="space-y-1">
          {expiredCount > 0 && (
            <p className="font-semibold">
              ⚠️ {expiredCount} lot(s) périmé(s)
            </p>
          )}
          {expiringCount > 0 && (
            <p>
              🔔 {expiringCount} lot(s) expire(nt) dans les 30 prochains jours
            </p>
          )}
          <p className="text-sm mt-2">
            Produits concernés: {expiringBatches.slice(0, 3).map((b: any) => b.products?.name).join(', ')}
            {expiringBatches.length > 3 && ` et ${expiringBatches.length - 3} autre(s)...`}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
