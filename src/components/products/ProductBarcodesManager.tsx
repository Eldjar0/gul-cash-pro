import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Star } from 'lucide-react';
import {
  useProductBarcodes,
  useAddProductBarcode,
  useDeleteProductBarcode,
  useSetPrimaryBarcode,
} from '@/hooks/useProductBarcodes';

interface ProductBarcodesManagerProps {
  productId: string;
}

export const ProductBarcodesManager = ({ productId }: ProductBarcodesManagerProps) => {
  const [newBarcode, setNewBarcode] = useState('');
  const { data: barcodes = [], isLoading } = useProductBarcodes(productId);
  const addBarcode = useAddProductBarcode();
  const deleteBarcode = useDeleteProductBarcode();
  const setPrimary = useSetPrimaryBarcode();

  const handleAddBarcode = () => {
    if (!newBarcode.trim()) return;
    
    addBarcode.mutate(
      { productId, barcode: newBarcode.trim(), isPrimary: barcodes.length === 0 },
      {
        onSuccess: () => setNewBarcode(''),
      }
    );
  };

  const handleDelete = (id: string) => {
    // Empêcher la suppression du dernier code-barres
    if (barcodes.length === 1) {
      return;
    }
    deleteBarcode.mutate({ id, productId });
  };

  const handleSetPrimary = (id: string) => {
    setPrimary.mutate({ id, productId });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-3">
      <Label>Codes-barres</Label>
      
      <div className="space-y-2">
        {barcodes.map((barcode) => (
          <Card key={barcode.id} className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <code className="text-sm font-mono">{barcode.barcode}</code>
                {barcode.is_primary && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {!barcode.is_primary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSetPrimary(barcode.id)}
                    title="Définir comme principal"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                {barcodes.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(barcode.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ajouter un code-barres"
          value={newBarcode}
          onChange={(e) => setNewBarcode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddBarcode();
            }
          }}
        />
        <Button onClick={handleAddBarcode} disabled={!newBarcode.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>
    </div>
  );
};