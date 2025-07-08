import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
          last_seen?: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
          last_seen?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'editor' | 'viewer'
          updated_at?: string
          last_seen?: string
        }
      }
      products: {
        Row: {
          id: string
          familia: string
          modelo: string
          acabamento: string
          cor: string
          comprimento: number | string
          foto?: string
          created_at: string
          updated_at: string
          created_by: string
          updated_by?: string
        }
        Insert: {
          id?: string
          familia: string
          modelo: string
          acabamento: string
          cor: string
          comprimento: number | string
          foto?: string
          created_at?: string
          updated_at?: string
          created_by: string
          updated_by?: string
        }
        Update: {
          id?: string
          familia?: string
          modelo?: string
          acabamento?: string
          cor?: string
          comprimento?: number | string
          foto?: string
          updated_at?: string
          updated_by?: string
        }
      }
      materials: {
        Row: {
          id: string
          product_id: string
          pecas: number
          estante: string
          prateleira: number
          posicao?: 'esquerda' | 'central' | 'direita'
          created_at: string
          updated_at: string
          created_by: string
          updated_by?: string
        }
        Insert: {
          id?: string
          product_id: string
          pecas: number
          estante: string
          prateleira: number
          posicao?: 'esquerda' | 'central' | 'direita'
          created_at?: string
          updated_at?: string
          created_by: string
          updated_by?: string
        }
        Update: {
          id?: string
          product_id?: string
          pecas?: number
          estante?: string
          prateleira?: number
          posicao?: 'esquerda' | 'central' | 'direita'
          updated_at?: string
          updated_by?: string
        }
      }
      movements: {
        Row: {
          id: string
          material_id: string
          type: 'entrada' | 'saida'
          pecas: number
          norc: string
          date: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          material_id: string
          type: 'entrada' | 'saida'
          pecas: number
          norc: string
          date: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          material_id?: string
          type?: 'entrada' | 'saida'
          pecas?: number
          norc?: string
          date?: string
          created_by?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Record<string, any>
          new_values?: Record<string, any>
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Record<string, any>
          new_values?: Record<string, any>
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          old_values?: Record<string, any>
          new_values?: Record<string, any>
          user_id?: string
        }
      }
    }
  }
}