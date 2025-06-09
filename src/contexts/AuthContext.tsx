import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Interface para o usuário do banco
interface DatabaseUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: DatabaseUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (userData: Partial<DatabaseUser>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Componente de Error Boundary para o AuthProvider
class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthProvider Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

// AuthProvider principal
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<DatabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Buscar dados do usuário do banco
  const fetchUserProfile = useCallback(async (authUser: User): Promise<DatabaseUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        console.error('Erro ao buscar perfil do usuário:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
      return null
    }
  }, [])

  // Configurar sessão e usuário
  const setAuthSession = useCallback(async (newSession: Session | null) => {
    setSession(newSession)
    
    if (newSession?.user) {
      try {
        const userProfile = await fetchUserProfile(newSession.user)
        setUser(userProfile)
      } catch (error) {
        console.error('Erro ao buscar perfil:', error)
        setUser(null)
      }
    } else {
      setUser(null)
    }
    
    setLoading(false)
    setInitialized(true)
  }, [fetchUserProfile])

  // Inicializar autenticação (com dependências corretas)
  useEffect(() => {
    let isMounted = true
    
    const initializeAuth = async () => {
      try {
        // Buscar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao obter sessão:', error)
        }
        
        if (isMounted) {
          await setAuthSession(session)
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error)
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted && initialized) {
          await setAuthSession(session)
        }
      }
    )

    // Inicializar apenas se não foi inicializado ainda
    if (!initialized) {
      initializeAuth()
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setAuthSession, initialized])

  // Função de login com Supabase Auth
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setLoading(false)
        return { error: error.message }
      }

      // A sessão será automaticamente configurada pelo listener onAuthStateChange
      return { error: null }
    } catch (error) {
      setLoading(false)
      console.error('Erro inesperado no login:', error)
      return { error: 'Erro inesperado. Tente novamente.' }
    }
  }

  // Função de logout
  const signOut = async (): Promise<void> => {
    try {
      // Limpar estado local primeiro
      setUser(null)
      setSession(null)
      setLoading(false)
      
      // Fazer logout do Supabase
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Função para atualizar perfil
  const updateProfile = async (userData: Partial<DatabaseUser>): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'Usuário não autenticado' }
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { error: 'Erro ao atualizar perfil. Tente novamente.' }
      }

      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...userData } : null)
      return { error: null }
    } catch (error) {
      console.error('Erro inesperado ao atualizar perfil:', error)
      return { error: 'Erro inesperado. Tente novamente.' }
    }
  }

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signOut,
    updateProfile,
  }), [user, session, loading])

  // Debug do estado atual (apenas um log)
  console.log('AuthContext - estado:', { 
    user: user?.email || 'null', 
    loading, 
    session: !!session, 
    initialized 
  })

  const fallback = (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Erro no sistema de autenticação</h3>
      <p>Por favor, recarregue a página.</p>
      <button onClick={() => window.location.reload()}>
        Recarregar
      </button>
    </div>
  )

  return (
    <AuthErrorBoundary fallback={fallback}>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </AuthErrorBoundary>
  )
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 