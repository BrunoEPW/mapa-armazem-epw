import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface RealtimeNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  user_name?: string;
}

export const useRealTimeSync = (
  onMaterialsChange?: () => void,
  onProductsChange?: () => void,
  onMovementsChange?: () => void
) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    console.log('🔄 [useRealTimeSync] Real-time subscriptions disabled - warehouse tables not available');
    
    // Skip real-time subscriptions since warehouse tables don't exist yet
    // This prevents WebSocket errors in production
    
    return () => {
      // No subscriptions to cleanup
    };
  }, [user, onMaterialsChange, onProductsChange, onMovementsChange]);

  const addNotification = (message: string, type: RealtimeNotification['type'], user_name?: string) => {
    const notification: RealtimeNotification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: new Date(),
      user_name,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only last 10

    // Show toast for important notifications
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else if (type === 'error') {
      toast.error(message);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    connectedUsers,
    clearNotifications,
  };
};