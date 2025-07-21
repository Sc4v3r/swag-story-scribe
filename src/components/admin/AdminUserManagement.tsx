import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, UserPlus, AlertTriangle, UserX, Ban, Trash2, Key } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  department: string | null;
  business_vertical: string | null;
  status: 'active' | 'blocked' | 'deleted';
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
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine the data manually
      const usersWithRoles: UserWithRole[] = profiles?.map((profile) => {
        const userRole = roles?.find(role => role.user_id === profile.user_id);
        return {
          ...profile,
          role: (userRole?.role || 'user') as 'admin' | 'user',
          status: (profile.status || 'active') as 'active' | 'blocked' | 'deleted'
        };
      }) || [];

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
        .maybeSingle();

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

  const blockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'blocked' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User has been blocked',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to block user',
        variant: 'destructive',
      });
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User has been unblocked',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock user',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'deleted' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User has been deleted',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const generateTempPassword = () => {
    // Generate a secure temporary password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const resetUserPassword = async (userId: string, userEmail: string) => {
    try {
      setResettingPassword(userId);
      
      // Generate a temporary password
      const tempPass = generateTempPassword();

      // Call our edge function to reset the password with admin privileges
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          userId: userId,
          newPassword: tempPass
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setTempPassword(tempPass);
      toast({
        title: 'Password Reset Successful',
        description: 'Temporary password generated. Make sure to share it securely with the user.',
      });

    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Password Reset Failed',
        description: error.message || 'Failed to reset user password.',
        variant: 'destructive',
      });
      setTempPassword('');
    } finally {
      setResettingPassword(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard',
        description: 'Temporary password copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleResetDialogClose = () => {
    setResetDialogOpen(null);
    setTempPassword('');
    setResettingPassword(null);
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
              {users.filter(user => user.status !== 'deleted').map((user) => (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    user.status === 'blocked' ? 'bg-red-50 border-red-200' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {user.display_name || 'No name'}
                      {user.status === 'blocked' && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Blocked
                        </Badge>
                      )}
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
                    
                    {user.status === 'active' && user.role === 'user' && (
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
                    
                    {user.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => blockUser(user.user_id)}
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Block
                      </Button>
                    )}
                    
                    {user.status === 'blocked' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unblockUser(user.user_id)}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Unblock
                      </Button>
                     )}
                     
                     <Dialog 
                       open={resetDialogOpen === user.user_id} 
                       onOpenChange={(open) => {
                         if (!open) {
                           handleResetDialogClose();
                         }
                       }}
                     >
                       <DialogTrigger asChild>
                         <Button
                           size="sm"
                           variant="outline"
                           disabled={resettingPassword === user.user_id}
                           onClick={() => setResetDialogOpen(user.user_id)}
                         >
                           {resettingPassword === user.user_id ? (
                             <>
                               <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                               Resetting...
                             </>
                           ) : (
                             <>
                               <Key className="h-3 w-3 mr-1" />
                               Reset Password
                             </>
                           )}
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader>
                           <DialogTitle>Reset User Password</DialogTitle>
                           <DialogDescription>
                             This will generate a temporary password for {user.display_name || user.email}.
                             Make sure to share the temporary password securely with the user.
                           </DialogDescription>
                         </DialogHeader>
                         
                         {tempPassword && (
                           <div className="space-y-4">
                             <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                               <div className="flex items-center gap-2 text-amber-800 mb-2">
                                 <AlertTriangle className="h-4 w-4" />
                                 <span className="font-medium">Temporary Password Generated</span>
                               </div>
                               <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                                 {tempPassword}
                               </div>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => copyToClipboard(tempPassword)}
                                 className="mt-2"
                               >
                                 Copy Password
                               </Button>
                             </div>
                             <p className="text-sm text-muted-foreground">
                               Please share this password securely with the user and ask them to change it immediately after logging in.
                             </p>
                           </div>
                         )}
                         
                         <DialogFooter>
                           {!tempPassword ? (
                             <>
                               <Button
                                 variant="outline"
                                 onClick={handleResetDialogClose}
                               >
                                 Cancel
                               </Button>
                               <Button
                                 onClick={() => resetUserPassword(user.user_id, user.email || '')}
                                 disabled={resettingPassword === user.user_id}
                               >
                                 {resettingPassword === user.user_id ? 'Generating...' : 'Generate New Password'}
                               </Button>
                             </>
                           ) : (
                             <Button
                               onClick={handleResetDialogClose}
                               className="w-full"
                             >
                               Close
                             </Button>
                           )}
                         </DialogFooter>
                       </DialogContent>
                     </Dialog>
                     
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                            The user will be marked as deleted and will lose access to the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUser(user.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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