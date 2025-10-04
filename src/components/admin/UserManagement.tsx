import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' }
      });
      
      if (error) throw error;
      if (data?.users) {
        setUsers(data.users);
      }
    } catch (err) {
      toast.error('Erreur de chargement', {
        description: err instanceof Error ? err.message : 'Impossible de charger les utilisateurs'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Champs requis', {
        description: 'Email et mot de passe sont obligatoires'
      });
      return;
    }

    setIsLoading(true);
    try {
      const action = editingUser ? 'update' : 'create';
      const body: any = {
        action,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName || formData.email
      };

      if (editingUser) {
        body.userId = editingUser.id;
      }

      const { data, error } = await supabase.functions.invoke('manage-users', {
        body
      });
      
      if (error) throw error;
      
      toast.success(editingUser ? 'Compte modifié' : 'Compte créé', {
        description: `${formData.email} a été ${editingUser ? 'modifié' : 'créé'} avec succès`
      });
      
      setIsDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (err) {
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : 'Une erreur est survenue'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer le compte ${user.email} ?`)) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', userId: user.id }
      });
      
      if (error) throw error;
      
      toast.success('Compte supprimé', {
        description: `${user.email} a été supprimé`
      });
      
      loadUsers();
    } catch (err) {
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : 'Impossible de supprimer le compte'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      fullName: user.user_metadata?.full_name || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', fullName: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestion des comptes</span>
          <div className="flex gap-2">
            <Button onClick={loadUsers} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau compte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? 'Modifier le compte' : 'Créer un compte'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser ? 'Modifiez les informations du compte' : 'Créez un nouveau compte utilisateur'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email / Identifiant *</Label>
                      <Input
                        id="email"
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin ou email@exemple.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingUser ? "Laisser vide pour ne pas changer" : "Minimum 6 caractères"}
                        required={!editingUser}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nom complet</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nom affiché"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          En cours...
                        </>
                      ) : (
                        editingUser ? 'Modifier' : 'Créer'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
        <CardDescription>
          Créez, modifiez et supprimez des comptes utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !users.length ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun compte utilisateur
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email / Identifiant</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.user_metadata?.full_name || '-'}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString('fr-BE')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditDialog(user)}
                        disabled={isLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDelete(user)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
