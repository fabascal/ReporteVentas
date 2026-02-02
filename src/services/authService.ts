import axios from 'axios'
import { User } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface LoginResponse {
  token?: string
  user?: User
  require2FA?: boolean
  requires2FA?: boolean
  userId?: string
  email?: string
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', { email, password })
    return response.data
  },

  async verify2FA(email: string, code: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/verify-2fa', { email, code })
    return response.data
  },

  async verify2FALogin(userId: string, token: string): Promise<{ token: string; user: User }> {
    const response = await api.post<{ token: string; user: User }>('/auth/2fa/verify-login', { userId, token })
    return response.data
  },

  async get2FAStatus(): Promise<{ enabled: boolean }> {
    const response = await api.get<{ enabled: boolean }>('/auth/2fa/status')
    return response.data
  },

  async setup2FA(): Promise<{ secret: string; qrCodeUrl: string }> {
    const response = await api.post<{ secret: string; qrCodeUrl: string }>('/auth/2fa/setup')
    return response.data
  },

  async confirm2FA(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/2fa/confirm', { token })
    return response.data
  },

  async disable2FA(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/2fa/disable')
    return response.data
  },

  async loginWithOAuth(provider: string): Promise<LoginResponse> {
    const response = await api.get<LoginResponse>(`/auth/${provider}/callback`)
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
}

