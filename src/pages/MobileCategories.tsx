import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  FolderKanban,
  Save,
  Palette,
} from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';
import { toast } from 'sonner';

export default function MobileCategories() {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    color: '#22c55e',
    display_order: 0,
  });

  const colorPresets = [
    { name: 'Vert', value: '#22c55e' },
    { name: 'Bleu', value: '#3b82f6' },
    { name: 'Rouge', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Violet', value: '#a855f7' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Jaune', value: '#eab308' },
    { name: 'Cyan', value: '#06b6d4' },
  ];

  const handleOpenForm = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color,
        display_order: category.display_order,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        color: '#22c55e',
        display_order: categories.length,
      });
    }
    setView('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Nom requis');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          ...formData,
        });
      } else {
        await createCategory.mutateAsync(formData);
      }
      setView('list');
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
        <div className="max-w-md mx-auto space-y-6 pb-20">
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-black">Catégories</h1>
              <p className="text-sm text-muted-foreground">{categories.length} catégories</p>
            </div>
            <Button
              onClick={() => handleOpenForm()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouvelle
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-3">
              {categories.length === 0 ? (
                <Card className="p-8 text-center">
                  <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucune catégorie</p>
                  <Button
                    onClick={() => handleOpenForm()}
                    className="mt-4 gap-2"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une catégorie
                  </Button>
                </Card>
              ) : (
                categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          <FolderKanban className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Ordre: {category.display_order}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenForm(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="max-w-md mx-auto pb-20">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('list')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-black">
            {editingCategory ? 'Modifier' : 'Nouvelle'} Catégorie
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Nom de la catégorie *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Fruits et légumes"
                data-scan-ignore="true"
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      formData.color === preset.value
                        ? 'border-foreground scale-110'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: preset.value }}
                  >
                    {formData.color === preset.value && (
                      <Palette className="h-5 w-5 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                data-scan-ignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Les catégories avec un ordre plus petit apparaissent en premier
              </p>
            </div>

            <div
              className="p-4 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: formData.color }}
            >
              <FolderKanban className="h-8 w-8 text-white" />
              <div className="flex-1 text-white">
                <h3 className="font-bold">{formData.name || 'Aperçu'}</h3>
                <p className="text-sm opacity-90">Ordre: {formData.display_order}</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setView('list')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCategory ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
