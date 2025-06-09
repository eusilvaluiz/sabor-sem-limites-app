import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password_hash: string
          avatar_url: string | null
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password_hash: string
          avatar_url?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          avatar_url?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          image_url: string | null
          recipe_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          recipe_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          recipe_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string | null
          category_id: string | null
          servings: number
          difficulty: 'Fácil' | 'Médio' | 'Difícil'
          is_gluten_free: boolean
          is_lactose_free: boolean
          ingredients: string
          instructions: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url?: string | null
          category_id?: string | null
          servings: number
          difficulty: 'Fácil' | 'Médio' | 'Difícil'
          is_gluten_free?: boolean
          is_lactose_free?: boolean
          ingredients: string
          instructions: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string | null
          category_id?: string | null
          servings?: number
          difficulty?: 'Fácil' | 'Médio' | 'Difícil'
          is_gluten_free?: boolean
          is_lactose_free?: boolean
          ingredients?: string
          instructions?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
        }
      }
      nutrition_data: {
        Row: {
          id: string
          recipe_id: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fat: number | null
          fiber: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          fiber?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      chef_leia_config: {
        Row: {
          id: string
          title: string
          description: string
          assistant_id: string | null
          avatar_type: 'emoji' | 'image'
          avatar_emoji: string
          avatar_color: string
          avatar_image_url: string | null
          suggestions: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          description: string
          assistant_id?: string | null
          avatar_type?: 'emoji' | 'image'
          avatar_emoji?: string
          avatar_color?: string
          avatar_image_url?: string | null
          suggestions?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          assistant_id?: string | null
          avatar_type?: 'emoji' | 'image'
          avatar_emoji?: string
          avatar_color?: string
          avatar_image_url?: string | null
          suggestions?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_chat_messages: {
        Row: {
          id: string
          user_id: string
          chat_type: 'general' | 'recipe' | 'function'
          message_type: 'user' | 'ai'
          message: string
          thread_id: string | null
          recipe_id: string | null
          function_type: string | null
          context_data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chat_type: 'general' | 'recipe' | 'function'
          message_type: 'user' | 'ai'
          message: string
          thread_id?: string | null
          recipe_id?: string | null
          function_type?: string | null
          context_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chat_type?: 'general' | 'recipe' | 'function'
          message_type?: 'user' | 'ai'
          message?: string
          thread_id?: string | null
          recipe_id?: string | null
          function_type?: string | null
          context_data?: any | null
          created_at?: string
        }
      }
      recipe_shares: {
        Row: {
          id: string
          recipe_id: string
          user_id: string | null
          platform: string
          shared_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          recipe_id: string
          user_id?: string | null
          platform: string
          shared_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          recipe_id?: string
          user_id?: string | null
          platform?: string
          shared_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 