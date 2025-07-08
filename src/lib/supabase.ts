import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
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
        }
        Update: {
          id?: string
          product_id?: string
          pecas?: number
          estante?: string
          prateleira?: number
          posicao?: 'esquerda' | 'central' | 'direita'
          updated_at?: string
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
          user_id?: string
        }
        Insert: {
          id?: string
          material_id: string
          type: 'entrada' | 'saida'
          pecas: number
          norc: string
          date: string
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          material_id?: string
          type?: 'entrada' | 'saida'
          pecas?: number
          norc?: string
          date?: string
          user_id?: string
        }
      }
    }
  }
}