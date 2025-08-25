
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: string;
  created_at: string;
  user_name?: string;
}

export const useAuditLog = () => {
  const auth = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Only access user when auth context is ready
  const user = auth?.user || null;

  const logAction = async (
    table_name: string,
    record_id: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    old_values?: Record<string, any>,
    new_values?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      // Audit logs table not available in current schema - log to console for now
      console.log('Audit log:', { table_name, record_id, action, old_values, new_values, user_id: user.id });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const getAuditLogs = async (table_name?: string, record_id?: string) => {
    try {
      setLoading(true);
      // Audit logs table not available in current schema - return empty array
      const logsWithUserNames: AuditLogEntry[] = [];
      setAuditLogs(logsWithUserNames);
      return logsWithUserNames;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getRecentActivity = async (hours: number = 24) => {
    try {
      // Audit logs table not available in current schema - return empty array
      return [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };

  return {
    auditLogs,
    loading,
    logAction,
    getAuditLogs,
    getRecentActivity,
  };
};
