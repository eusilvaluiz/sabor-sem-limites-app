import { supabase } from '@/lib/supabase'

// Função para operações administrativas (usando Service Role Key)
const getSupabaseAdmin = () => {
  // Reutilizar a instância existente mas com Service Role Key
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('Service Role Key não configurada')
  }
  
  // Criar cliente admin apenas quando necessário
  return {
    auth: {
      admin: {
        createUser: async (userData: { email: string; password: string; email_confirm?: boolean }) => {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'apikey': serviceKey
            },
            body: JSON.stringify(userData)
          })
          
          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Erro ao criar usuário')
          }
          
          const data = await response.json()
          return { data: { user: data }, error: null }
        }
      }
    }
  }
}

export interface DatabaseUser {
  id: string
  name: string
  email: string
  password_hash: string
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  avatarUrl: string | null
  role: 'admin' | 'user'
  createdAt: string
}

// Converter dados do banco para interface do frontend
function convertFromDatabase(dbUser: DatabaseUser): User {
  // Formatar data corretamente ignorando timezone (usar UTC)
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', dateString)
      return new Date().toISOString().split('T')[0] // Fallback para hoje
    }
    
    // Usar métodos UTC para ignorar timezone local
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    
    const formatted = `${year}-${month}-${day}`
    return formatted
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    password: '', // Nunca retornar senha do banco
    avatarUrl: dbUser.avatar_url,
    role: dbUser.role as 'admin' | 'user',
    createdAt: formatDate(dbUser.created_at)
  }
}

// Converter dados do frontend para interface do banco (criação)
function convertToDatabase(user: Omit<User, 'id' | 'createdAt'>): Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: user.name,
    email: user.email,
    password_hash: user.password, // Em produção seria hash
    avatar_url: user.avatarUrl,
    role: user.role
  }
}

// Converter dados do frontend para interface do banco (atualização - sem senha)
function convertToDatabaseUpdate(user: Omit<User, 'id' | 'createdAt' | 'password'>): Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at' | 'password_hash'> {
  return {
    name: user.name,
    email: user.email,
    avatar_url: user.avatarUrl,
    role: user.role
  }
}

export const usersService = {
  // Listar todos os usuários
  async getAll(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Erro ao carregar usuários')
      }

      return (data || []).map(convertFromDatabase)
    } catch (error) {
      throw error
    }
  },

  // Criar novo usuário (Admin API + tabela users)
  async create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    try {
      // 1. Criar usuário no Supabase Auth usando Admin API
      const adminClient = getSupabaseAdmin()
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Confirmar email automaticamente
      })

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário: dados inválidos')
      }

      // 2. Criar registro na tabela users usando o ID do Auth
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          password_hash: userData.password, // Temporário
          avatar_url: userData.avatarUrl,
          role: userData.role,
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Erro ao criar usuário na tabela: ${error.message}`)
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Atualizar usuário existente (sem senha)
  async update(id: string, userData: Omit<User, 'id' | 'createdAt' | 'password'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          avatar_url: userData.avatarUrl,
          role: userData.role
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error('Erro ao atualizar usuário')
      }

      return convertFromDatabase(data)
    } catch (error) {
      throw error
    }
  },

  // Deletar usuário
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Erro ao deletar usuário: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  },

  // Buscar usuários por termo
  async search(searchTerm: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Erro ao buscar usuários')
      }

      return (data || []).map(convertFromDatabase)
    } catch (error) {
      throw error
    }
  }
} 