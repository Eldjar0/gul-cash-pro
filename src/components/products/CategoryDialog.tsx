import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, Category } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DynamicIcon } from '@/components/ui/dynamic-icon';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDialog({ open, onOpenChange }: CategoryDialogProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    icon: 'Package',
  });

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon || 'Package',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      icon: 'Package',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      if (editingId) {
        await updateCategory.mutateAsync({
          id: editingId,
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
        });
      } else {
        const maxOrder = categories.reduce((max, cat) => Math.max(max, cat.display_order), 0);
        await createCategory.mutateAsync({
          name: formData.name,
          color: formData.color,
          icon: formData.icon,
          display_order: maxOrder + 1,
        });
      }
      handleCancel();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Catégorie supprimée');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const commonIcons = [
    'Package', 'ShoppingCart', 'Coffee', 'Pizza', 'Wine', 'Beef', 'Apple',
    'Milk', 'Leaf', 'Sparkles', 'Star', 'Heart', 'Zap', 'Gift'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gestion des Catégories</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {/* Form nouvelle catégorie / édition */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="category-name">Nom de la catégorie *</Label>
                  <Input
                    id="category-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Boissons"
                  />
                </div>

                <div>
                  <Label htmlFor="category-color">Couleur</Label>
                  <div className="flex gap-2">
                    <Input
                      id="category-color"
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

                <div>
                  <Label>Icône</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {commonIcons.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-2 rounded border-2 transition-all duration-100 hover:brightness-110 hover:shadow-lg ${
                          formData.icon === iconName
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <DynamicIcon name={iconName} className="h-5 w-5 mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingId ? (
                    <>
                      <Button onClick={handleSave} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleSave} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la catégorie
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Liste des catégories */}
            <div className="space-y-2">
              <h3 className="font-semibold">Catégories existantes</h3>
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
                >
                  <div
                    className="p-2 rounded"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <DynamicIcon
                      name={category.icon || 'Package'}
                      className="h-5 w-5"
                      style={{ color: category.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.color}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
