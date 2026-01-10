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
  estaciones?: string[]
  zonas?: string[]
}

