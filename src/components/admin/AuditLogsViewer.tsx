import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FileText, RefreshCw, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function AuditLogsViewer() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as AuditLog[]);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'ROLE_GRANTED':
      case 'ADMIN_CREATED':
        return 'default';
      case 'ROLE_REVOKED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatJsonValues = (values: any) => {
    if (!values) return 'N/A';
    return JSON.stringify(values, null, 2);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only administrators can view audit logs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Security Audit Logs
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading audit logs...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionVariant(log.action)}>
                        {log.action}
                      </Badge>
                      {log.table_name && (
                        <Badge variant="outline">
                          {log.table_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">User ID:</span>
                      <span className="ml-2 font-mono text-xs">
                        {log.user_id || 'System'}
                      </span>
                    </div>
                    
                    {log.record_id && (
                      <div>
                        <span className="font-medium">Record ID:</span>
                        <span className="ml-2 font-mono text-xs">
                          {log.record_id}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {(log.old_values || log.new_values) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.old_values && (
                        <div>
                          <div className="font-medium text-sm mb-1">Old Values:</div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {formatJsonValues(log.old_values)}
                          </pre>
                        </div>
                      )}
                      
                      {log.new_values && (
                        <div>
                          <div className="font-medium text-sm mb-1">New Values:</div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {formatJsonValues(log.new_values)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {log.ip_address && (
                    <div className="text-xs text-muted-foreground">
                      IP: {log.ip_address}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}