import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

    // Subscribe to materials changes
    const materialsSubscription = supabase
      .channel('materials-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials',
        },
        (payload) => {
          console.log('Materials change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            addNotification('Material adicionado ao estoque', 'success');
          } else if (payload.eventType === 'UPDATE') {
            addNotification('Material atualizado no estoque', 'info');
          } else if (payload.eventType === 'DELETE') {
            addNotification('Material removido do estoque', 'warning');
          }
          
          onMaterialsChange?.();
        }
      )
      .subscribe();

    // Subscribe to products changes
    const productsSubscription = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Products change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            addNotification('Novo produto criado', 'success');
          } else if (payload.eventType === 'UPDATE') {
            addNotification('Produto atualizado', 'info');
          } else if (payload.eventType === 'DELETE') {
            addNotification('Produto eliminado', 'warning');
          }
          
          onProductsChange?.();
        }
      )
      .subscribe();

    // Subscribe to movements changes
    const movementsSubscription = supabase
      .channel('movements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'movements',
        },
        (payload) => {
          console.log('Movements change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const movement = payload.new as any;
            const type = movement.type === 'entrada' ? 'entrada' : 'saída';
            addNotification(`Nova ${type} registada`, 'info');
          }
          
          onMovementsChange?.();
        }
      )
      .subscribe();

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel('user-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceSubscription.presenceState();
        const users = Object.keys(state);
        setConnectedUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        addNotification(`Utilizador ${key} entrou`, 'info');
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        addNotification(`Utilizador ${key} saiu`, 'info');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceSubscription.track({
            user_id: user.id,
            user_name: user.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      materialsSubscription.unsubscribe();
      productsSubscription.unsubscribe();
      movementsSubscription.unsubscribe();
      presenceSubscription.unsubscribe();
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