import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type MenuItemType = 'route' | 'view'

export interface MenuItem {
  id: string
  menu_id: string
  type: MenuItemType
  path?: string | null
  view_id?: string | null
  label: string
  icon: string
  orden: number
  requiere_exact_match: boolean
  activo: boolean
  roles: string[]
  created_at?: string
  updated_at?: string
}

export interface CreateMenuData {
  menu_id: string
  tipo: MenuItemType
  path?: string
  view_id?: string
  label: string
  icon: string
  orden?: number
  requiere_exact_match?: boolean
  roles: string[]
}

export interface UpdateMenuData {
  menu_id?: string
  tipo?: MenuItemType
  path?: string
  view_id?: string
  label?: string
  icon?: string
  orden?: number
  requiere_exact_match?: boolean
  activo?: boolean
  roles?: string[]
}

export const menusService = {
  // Obtener todos los menús (solo Admin)
  async getMenus(): Promise<MenuItem[]> {
    const response = await api.get<MenuItem[]>('/menus')
    return response.data
  },

  // Obtener menús por rol (público para usuarios autenticados)
  async getMenusByRole(role: string): Promise<MenuItem[]> {
    const response = await api.get<MenuItem[]>(`/menus/by-role/${role}`)
    return response.data
  },

  // Obtener un menú por ID
  async getMenuById(id: string): Promise<MenuItem> {
    const response = await api.get<MenuItem>(`/menus/${id}`)
    return response.data
  },

  // Crear un nuevo menú
  async createMenu(data: CreateMenuData): Promise<MenuItem> {
    const response = await api.post<MenuItem>('/menus', data)
    return response.data
  },

  // Actualizar un menú
  async updateMenu(id: string, data: UpdateMenuData): Promise<MenuItem> {
    const response = await api.put<MenuItem>(`/menus/${id}`, data)
    return response.data
  },

  // Eliminar un menú (soft delete)
  async deleteMenu(id: string): Promise<void> {
    await api.delete(`/menus/${id}`)
  },
}

