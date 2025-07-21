import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { UserStoriesManagement } from '@/components/admin/UserStoriesManagement';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';
import { TagsAndVerticalManagement } from '@/components/admin/TagsAndVerticalManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, Activity, Tag } from 'lucide-react';

const AdminPanel = () => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine the active tab based on the current route
  const getActiveTab = () => {
    if (location.pathname === '/admin/users') return 'users';
    if (location.pathname === '/admin/tags') return 'tags';
    if (location.pathname === '/admin/user-stories') return 'user-stories';
    if (location.pathname === '/admin/audit') return 'audit';
    return 'users';
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    switch (value) {
      case 'users':
        navigate('/admin/users');
        break;
      case 'tags':
        navigate('/admin/tags');
        break;
      case 'user-stories':
        navigate('/admin/user-stories');
        break;
      case 'audit':
        navigate('/admin/audit');
        break;
      default:
        navigate('/admin/users');
    }
  };

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
      <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags & Verticals
          </TabsTrigger>
          <TabsTrigger value="user-stories" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            User Stories
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="tags">
          <TagsAndVerticalManagement />
        </TabsContent>

        <TabsContent value="user-stories">
          <UserStoriesManagement />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;