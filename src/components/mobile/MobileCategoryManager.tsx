import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, FolderKanban, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';

export const MobileCategoryManager = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6', icon: 'Package', display_order: 0 });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
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
      setFormData({ name: '', color: '#3B82F6', icon: 'Package', display_order: 0 });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color || '#3B82F6',
      icon: category.icon || 'Package',
      display_order: category.display_order || 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    const productsInCategory = products.filter(p => p.category_id === categoryId).length;
    
    if (productsInCategory > 0) {
      toast.error(`Impossible: ${productsInCategory} produit(s) dans cette catégorie`);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/mobile')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex-1">Catégories</h1>
          <Button 
            size="icon"
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', color: '#3B82F6', icon: 'Package', display_order: 0 });
              setDialogOpen(true);
            }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Liste des catégories */}
      <ScrollArea className="h-[calc(100vh-150px)]">
        <div className="p-4 space-y-3">
          {categories.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune catégorie</p>
            </Card>
          ) : (
            categories.map((category) => {
      const productCount = products.filter(p => p.category_id === category.id).length;

              return (
                <Card key={category.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3 className="font-bold text-base">{category.name}</h3>
                      </div>
                      <Badge variant="secondary">
                        {productCount} produit{productCount !== 1 ? 's' : ''}
                      </Badge>
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
                        disabled={productCount > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Dialog Créer/Modifier */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier' : 'Nouvelle'} catégorie
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Boissons"
              />
            </div>

            <div>
              <Label htmlFor="color">Couleur</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileCategoryManager;
