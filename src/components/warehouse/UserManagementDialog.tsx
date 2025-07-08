import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Eye, Edit, Trash2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, UserRole } from '@/types/auth';
import { toast } from 'sonner';

interface UserManagementDialogProps {
  onClose: () => void;
}

export const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ onClose }) => {
  const { user, signUp, hasPermission, getActiveUsers } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const activeUsers = await getActiveUsers();
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasPermission('canManageUsers')) {
      toast.error('Não tem permissão para criar utilizadores');
      return;
    }

    try {
      setLoading(true);
      const success = await signUp(email, password, name, role);
      
      if (success) {
        setEmail('');
        setPassword('');
        setName('');
        setRole('viewer');
        setShowAddUser(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return 'destructive';
      case 'editor':
        return 'default';
      case 'viewer':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getRoleLabel = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return 'Administrador';
      case 'editor':
        return 'Editor';
      case 'viewer':
        return 'Visualizador';
      default:
        return userRole;
    }
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Nunca';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return date.toLocaleDateString('pt-PT');
  };

  if (!hasPermission('canManageUsers')) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Acesso Negado</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Não tem permissão para gerir utilizadores.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Gestão de Utilizadores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add User Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="w-5 h-5" />
                Adicionar Novo Utilizador
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showAddUser ? (
                <Button onClick={() => setShowAddUser(true)} className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar Novo Utilizador
                </Button>
              ) : (
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@epw.pt"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password temporária"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="role">Nível de Acesso</Label>
                      <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Visualizador</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'A criar...' : 'Criar Utilizador'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddUser(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Utilizadores Registados ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">A carregar utilizadores...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum utilizador encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((userProfile) => (
                    <div
                      key={userProfile.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{userProfile.name}</h4>
                          <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                            {getRoleLabel(userProfile.role)}
                          </Badge>
                          {userProfile.id === user?.id && (
                            <Badge variant="outline">Você</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{userProfile.email}</p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Último acesso: {formatLastSeen(userProfile.last_seen)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {userProfile.id !== user?.id && (
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};