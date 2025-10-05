import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Users, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserManagement() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Création d'utilisateur
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'cashier'>('cashier');
  
  // Changement de mot de passe
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les utilisateurs avec emails via edge function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' },
      });

      if (usersError) throw usersError;

      const authUsers = usersData.users || [];

      // Récupérer les rôles de chaque utilisateur
      const usersWithRoles = await Promise.all(
        authUsers.map(async (authUser: any) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)
            .maybeSingle();

          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', authUser.id)
            .maybeSingle();

          return {
            id: authUser.id,
            email: authUser.email || 'N/A',
            full_name: profileData?.full_name || 'Sans nom',
            role: roleData?.role || 'cashier',
            created_at: authUser.created_at,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newFullName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Vérifier le nombre de caissiers si on crée un caissier
    if (newRole === 'cashier') {
      const cashierCount = users.filter(u => u.role === 'cashier').length;
      if (cashierCount >= 5) {
        toast.error('Limite de 5 caissiers atteinte');
        return;
      }
    }

    try {
      // Appeler la fonction edge pour créer l'utilisateur
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: newEmail,
          password: newPassword,
          fullName: newFullName,
          role: newRole,
        },
      });

      if (error) throw error;

      toast.success('Utilisateur créé avec succès');
      setCreateDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('cashier');
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newUserPassword) {
      toast.error('Veuillez entrer un nouveau mot de passe');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update_password',
          user_id: selectedUser.id,
          new_password: newUserPassword,
        },
      });

      if (error) throw error;

      toast.success('Mot de passe modifié avec succès');
      setPasswordDialogOpen(false);
      setNewUserPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          user_id: userId,
        },
      });

      if (error) throw error;

      toast.success('Utilisateur supprimé');
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const cashierCount = users.filter(u => u.role === 'cashier').length;

  return (
    <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs ({users.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Caissiers: {cashierCount}/5
              </p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="new_email">Email *</Label>
                    <Input
                      id="new_email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_password">Mot de passe *</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_fullname">Nom complet *</Label>
                    <Input
                      id="new_fullname"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_role">Rôle *</Label>
                    <Select value={newRole} onValueChange={(value: 'admin' | 'cashier') => setNewRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cashier">Caissier</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateUser} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Créer l'utilisateur
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      user.role === 'admin' 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-blue-100 text-blue-800"
                    )}>
                      {user.role === 'admin' ? 'Administrateur' : 'Caissier'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user);
                        setPasswordDialogOpen(true);
                      }}
                    >
                      <Lock className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          )}
        

      {/* Dialog changement de mot de passe */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Utilisateur</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>
            <div>
              <Label htmlFor="new_user_password">Nouveau mot de passe *</Label>
              <Input
                id="new_user_password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
              />
            </div>
            <Button onClick={handleUpdatePassword} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Modifier le mot de passe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
