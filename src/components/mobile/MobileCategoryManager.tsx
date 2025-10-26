import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, FolderKanban } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { MobileLayout } from './MobileLayout';
import { toast } from 'sonner';

export const MobileCategoryManager = () => {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    display_order: 0,
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...formData,
        });
        toast.success('Catégorie modifiée');
      } else {
        await createCategory.mutateAsync(formData);
        toast.success('Catégorie créée');
      }
      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', color: '#3B82F6', display_order: 0 });
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      display_order: category.display_order || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    const productsInCategory = products.filter(p => p.category_id === categoryId);
    if (productsInCategory.length > 0) {
      toast.error(`Impossible de supprimer : ${productsInCategory.length} produit(s) dans cette catégorie`);
      return;
    }

    try {
      await deleteCategory.mutateAsync(categoryId);
      toast.success('Catégorie supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <MobileLayout
      title="Catégories"
      actions={
        <Button
          size="icon"
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', color: '#3B82F6', display_order: 0 });
            setDialogOpen(true);
          }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      }
    >
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 space-y-3">
          {categories.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune catégorie</p>
            </Card>
          ) : (
            categories.map((category) => {
              const productsCount = products.filter(p => p.category_id === category.id).length;

              return (
                <Card key={category.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <h3 className="font-bold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {productsCount} produit{productsCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        disabled={productsCount > 0}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier' : 'Nouvelle'} catégorie
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom de la catégorie"
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default MobileCategoryManager;
