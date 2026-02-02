export enum EstadoReporte {
  Pendiente = 'Pendiente',
  Aprobado = 'Aprobado',
  Rechazado = 'Rechazado',
}

export interface ReporteVentas {
  id: string
  estacionId: string
  estacionNombre: string
  zonaNombre?: string
  fecha: string
  aceites?: number // Campo único a nivel de reporte (en pesos)
  premium: {
    precio: number
    litros: number
    importe: number
    mermaVolumen: number
    mermaImporte: number
    mermaPorcentaje: number
    eficienciaReal?: number
    eficienciaImporte?: number
    eficienciaRealPorcentaje?: number
    iib?: number
    compras?: number
    cct?: number
    vDsc?: number
    dc?: number
    difVDsc?: number
    if?: number
    iffb?: number
  }
  magna: {
    precio: number
    litros: number
    importe: number
    mermaVolumen: number
    mermaImporte: number
    mermaPorcentaje: number
    eficienciaReal?: number
    eficienciaImporte?: number
    eficienciaRealPorcentaje?: number
    iib?: number
    compras?: number
    cct?: number
    vDsc?: number
    dc?: number
    difVDsc?: number
    if?: number
    iffb?: number
  }
  diesel: {
    precio: number
    litros: number
    importe: number
    mermaVolumen: number
    mermaImporte: number
    mermaPorcentaje: number
    eficienciaReal?: number
    eficienciaImporte?: number
    eficienciaRealPorcentaje?: number
    iib?: number
    compras?: number
    cct?: number
    vDsc?: number
    dc?: number
    difVDsc?: number
    if?: number
    iffb?: number
  }
  estado: EstadoReporte
  creadoPor: string
  revisadoPor?: string
  fechaCreacion: string
  fechaRevision?: string
  comentarios?: string
}

export interface Estacion {
  id: string
  nombre: string
  zonaId: string
  zonaNombre: string
  activa: boolean
  tienePremium?: boolean
  tieneMagna?: boolean
  tieneDiesel?: boolean
}

export interface AuditoriaReporte {
  id: string
  reporteId: string
  usuarioId: string
  usuarioNombre: string
  accion: 'CREAR' | 'ACTUALIZAR' | 'APROBAR' | 'RECHAZAR' | 'CAMBIO_ESTADO'
  campoModificado?: string
  valorAnterior?: string
  valorNuevo?: string
  descripcion?: string
  fechaCambio: string
}


export interface ProductoCatalogo {
  id: string
  nombre: string
  nombre_display: string
  activo: boolean
}
