import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const logAction = async (
    table_name: string,
    record_id: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    old_values?: Record<string, any>,
    new_values?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      await supabase.from('audit_logs').insert({
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id: user.id,
      });
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  };

  const getAuditLogs = async (table_name?: string, record_id?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (table_name) {
        query = query.eq('table_name', table_name);
      }

      if (record_id) {
        query = query.eq('record_id', record_id);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      const logsWithUserNames = data?.map(log => ({
        ...log,
        user_name: log.profiles?.name || 'Utilizador Desconhecido',
      })) || [];

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
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(log => ({
        ...log,
        user_name: log.profiles?.name || 'Utilizador Desconhecido',
      })) || [];
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