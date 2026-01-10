import axios from 'axios'

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

export interface Producto {
  id: string
  nombre_api: string
  nombre_display: string
  tipo_producto: 'premium' | 'magna' | 'diesel'
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateProductoData {
  nombre_api: string
  nombre_display: string
  tipo_producto: 'premium' | 'magna' | 'diesel'
  activo?: boolean
}

export interface UpdateProductoData {
  nombre_api?: string
  nombre_display?: string
  tipo_producto?: 'premium' | 'magna' | 'diesel'
  activo?: boolean
}

export const productosService = {
  async getProductos(): Promise<Producto[]> {
    const response = await api.get<Producto[]>('/productos')
    return response.data
  },

  async getProductoById(id: string): Promise<Producto> {
    const response = await api.get<Producto>(`/productos/${id}`)
    return response.data
  },

  async createProducto(data: CreateProductoData): Promise<Producto> {
    const response = await api.post<Producto>('/productos', data)
    return response.data
  },

  async updateProducto(id: string, data: UpdateProductoData): Promise<Producto> {
    const response = await api.put<Producto>(`/productos/${id}`, data)
    return response.data
  },

  async deleteProducto(id: string): Promise<void> {
    await api.delete(`/productos/${id}`)
  },
}

