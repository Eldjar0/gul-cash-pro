import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSuppliers, useSaveSuppliers, Supplier } from '@/hooks/useSuppliers';
import { toast } from 'sonner';

interface SupplierQuickCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (supplierId: string) => void;
}

export function SupplierQuickCreateDialog({ open, onClose, onCreated }: SupplierQuickCreateDialogProps) {
  const { data: suppliers = [] } = useSuppliers();
  const saveSuppliers = useSaveSuppliers();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    try {
      await saveSuppliers.mutateAsync([...suppliers, newSupplier]);
      toast.success('Fournisseur créé');
      onCreated(newSupplier.id);
      setFormData({ name: '', phone: '', email: '' });
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleClose = () => {
    setFormData({ name: '', phone: '', email: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau Fournisseur</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du fournisseur"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Téléphone</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0123456789"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={saveSuppliers.isPending} className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
