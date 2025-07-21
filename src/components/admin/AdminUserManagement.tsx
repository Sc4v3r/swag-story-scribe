import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserPlus, AlertTriangle } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  department: string | null;
  business_vertical: string | null;
}

interface UserWithRole extends Profile {
  role: 'admin' | 'user';
}

export function AdminUserManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their roles
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `);

      if (error) throw error;

      const usersWithRoles = data.map((user: any) => ({
        ...user,
        role: user.user_roles[0]?.role || 'user'
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      setPromoting(true);

      // Use the secure admin creation function
      const { error } = await supabase.rpc('create_admin_user', {
        _user_id: userId
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User promoted to admin successfully',
      });

      // Refresh the users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error promoting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to promote user',
        variant: 'destructive',
      });
    } finally {
      setPromoting(false);
    }
  };

  const findUserByEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .eq('email', newAdminEmail.trim())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  };

  const handlePromoteByEmail = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    const user = await findUserByEmail();
    if (!user) {
      toast({
        title: 'User Not Found',
        description: 'No user found with that email address',
        variant: 'destructive',
      });
      return;
    }

    await promoteToAdmin(user.user_id);
    setNewAdminEmail('');
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only administrators can access user management features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Security Notice</span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Admin privileges grant full access to the system. Only promote trusted users.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Promote User to Admin</Label>
            <div className="flex gap-2">
              <Input
                id="admin-email"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter user email address..."
                className="flex-1"
              />
              <Button 
                onClick={handlePromoteByEmail}
                disabled={promoting || !newAdminEmail.trim()}
              >
                {promoting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                    Promoting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Promote
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.display_name || 'No name'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    {user.department && (
                      <div className="text-xs text-muted-foreground">
                        {user.department} • {user.business_vertical}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    {user.role === 'user' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => promoteToAdmin(user.user_id)}
                        disabled={promoting}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Make Admin
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}