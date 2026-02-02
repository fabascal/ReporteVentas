export enum Role {
  Administrador = 'Administrador',
  GerenteEstacion = 'GerenteEstacion',
  GerenteZona = 'GerenteZona',
  Direccion = 'Direccion',
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  zona_id?: string // ID de zona asignada (GerenteZona)
  estaciones?: string[] // IDs de estaciones asignadas (GerenteEstacion)
  zonas?: string[] // IDs de zonas asignadas (para compatibilidad legacy)
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

