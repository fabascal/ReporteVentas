import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Role } from '../types/auth'
import { authService } from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ require2FA?: boolean; userId?: string; email?: string }>
  loginWithOAuth: (provider: string) => Promise<void>
  logout: () => void
  hasRole: (role: Role) => boolean
  completeLogin: (token: string, user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay token guardado
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Verificar que el token JWT no esté expirado
        const tokenParts = storedToken.split('.')
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]))
            const exp = payload.exp * 1000 // Convertir a milisegundos
            
            if (exp > Date.now()) {
              // Token válido
              setToken(storedToken)
              setUser(parsedUser)
            } else {
              // Token expirado, limpiar
              console.log('Token expirado, limpiando localStorage')
              localStorage.removeItem('token')
              localStorage.removeItem('user')
            }
          } catch (e) {
            console.error('Error al decodificar token:', e)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      } catch (e) {
        console.error('Error al parsear usuario:', e)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password)
      
      // Si requiere 2FA, devolver la respuesta sin configurar el estado
      if ('require2FA' in response && response.require2FA) {
        return response
      }
      
      // Login normal (sin 2FA)
      if ('token' in response && 'user' in response) {
        setToken(response.token)
        setUser(response.user)
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        return response
      }
      
      throw new Error('Respuesta de login inválida')
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  const completeLogin = (token: string, user: User) => {
    setToken(token)
    setUser(user)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const loginWithOAuth = async (provider: string) => {
    try {
      // Redirigir a la URL de OAuth
      window.location.href = `/api/auth/${provider}`
    } catch (error) {
      console.error('Error en OAuth:', error)
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const hasRole = (role: Role): boolean => {
    return user?.role === role
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithOAuth,
        logout,
        hasRole,
        completeLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

