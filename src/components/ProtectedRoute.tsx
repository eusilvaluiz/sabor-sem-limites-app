import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Não logado - redireciona para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Debug: verificar dados do usuário
  console.log('ProtectedRoute - User:', user)
  console.log('ProtectedRoute - RequireAdmin:', requireAdmin)
  console.log('ProtectedRoute - User role:', user?.role)

  // Precisa ser admin mas não é
  if (requireAdmin && user.role !== 'admin') {
    console.log('Access denied: User is not admin')
    return <Navigate to="/" replace />
  }

  // Autorizado - renderiza o componente
  return <>{children}</>
}

// Componente específico para rotas de admin
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute requireAdmin>
      {children}
    </ProtectedRoute>
  )
} 