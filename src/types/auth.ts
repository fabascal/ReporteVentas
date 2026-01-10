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
  estaciones?: string[] // IDs de estaciones asignadas
  zonas?: string[] // IDs de zonas asignadas
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

