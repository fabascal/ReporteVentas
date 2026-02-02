export interface PeriodoMensual {
  id: number;
  anio: number;
  mes: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  created_at: string;
}

export interface CierrePeriodo {
  id: number;
  zona_id: number;
  periodo_id: number;
  fecha_cierre: string;
  cerrado_por: number;
  cerrado_por_nombre?: string;
  observaciones: string | null;
  esta_cerrado: boolean;
  reabierto_en: string | null;
  reabierto_por: number | null;
  reabierto_por_nombre?: string | null;
  created_at: string;
}

export interface ValidacionCierre {
  puede_cerrar: boolean;
  total_estaciones: number;
  estaciones_completas: number;
  dias_en_mes: number;
  mensaje: string;
  estaciones: EstacionDetalle[];
}

export interface EstacionDetalle {
  id: number;
  nombre: string;
  clave: string;
  dias_reportados: number;
  total_dias: number;
  dias_aprobados: number;
}

export interface EstadoCierre {
  periodo: PeriodoMensual;
  cierre: CierrePeriodo | null;
  esta_cerrado: boolean;
}

export interface ResumenMensual {
  id: number;
  zona_id: number;
  periodo_id: number;
  estacion_id: number;
  estacion_nombre: string;
  estacion_clave: string;
  anio: number;
  mes: number;
  fecha: string;
  
  // Premium
  premium_volumen_total: number;
  premium_importe_total: number;
  premium_precio_promedio: number;
  premium_merma_volumen_total: number;
  premium_merma_importe_total: number;
  premium_merma_porcentaje_promedio: number;
  premium_eficiencia_real_total: number;
  premium_eficiencia_importe_total: number;
  premium_eficiencia_real_porcentaje_promedio: number;
  
  // Magna
  magna_volumen_total: number;
  magna_importe_total: number;
  magna_precio_promedio: number;
  magna_merma_volumen_total: number;
  magna_merma_importe_total: number;
  magna_merma_porcentaje_promedio: number;
  magna_eficiencia_real_total: number;
  magna_eficiencia_importe_total: number;
  magna_eficiencia_real_porcentaje_promedio: number;
  
  // Diesel
  diesel_volumen_total: number;
  diesel_importe_total: number;
  diesel_precio_promedio: number;
  diesel_merma_volumen_total: number;
  diesel_merma_importe_total: number;
  diesel_merma_porcentaje_promedio: number;
  diesel_eficiencia_real_total: number;
  diesel_eficiencia_importe_total: number;
  diesel_eficiencia_real_porcentaje_promedio: number;
  
  // Totales
  aceites_total: number;
  total_ventas: number;
  dias_reportados: number;
  
  created_at: string;
}

export interface CierreRequest {
  zonaId: string;
  anio: number;
  mes: number;
  observaciones?: string;
}

export interface ReabrirRequest {
  zonaId: string;
  anio: number;
  mes: number;
}

export interface CierreResponse {
  success: boolean;
  mensaje: string;
  cierre: CierrePeriodo;
  estaciones_procesadas?: number;
}

export interface CierreConPeriodo extends CierrePeriodo {
  periodo_nombre: string;
  anio: number;
  mes: number;
}

export interface EstacionFinanciera {
  estacion_id: string;
  estacion_nombre: string;
  clave: string;
  merma: number;
  entregas: number;
  gastos: number;
  saldo: number;
  estado: 'Liquidado' | 'Pendiente';
  dias_reportados: number;
  dias_aprobados: number;
  total_dias: number;
}

export interface ResumenFinanciero {
  saldo_inicial: number;
  entregas_recibidas: number;
  entregas_direccion: number;
  gastos_zona: number;
  merma_total: number;
  resguardo_actual: number;
  estaciones_liquidadas: number;
  estaciones_pendientes: number;
  total_estaciones: number;
  porcentaje_liquidacion: number;
}

export interface ControlFinanciero {
  zona_id: string;
  anio: number;
  mes: number;
  resumen: ResumenFinanciero;
  estaciones: EstacionFinanciera[];
}
