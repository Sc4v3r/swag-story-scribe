import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { UserStoriesManagement } from '@/components/admin/UserStoriesManagement';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Shield, Users, FileText, Activity } from 'lucide-react';

const AdminPanel = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage users, content, and system settings
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="user-stories" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            User Stories
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="user-stories">
          <UserStoriesManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogsViewer />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Access</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">
                  You have full system access
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    • Manage user roles
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • View audit logs
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Monitor system activity
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">User Management</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Promote users to admin</li>
                    <li>• Monitor user activity</li>
                    <li>• Manage access permissions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Content Oversight</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Moderate story content</li>
                    <li>• Manage story deletion</li>
                    <li>• Monitor compliance</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Admin Privileges
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  As an administrator, you have full access to user management and system settings. 
                  Please use these privileges responsibly and in accordance with your organization's policies.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;