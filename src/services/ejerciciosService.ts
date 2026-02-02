import api from '../config/axios';

export interface EjercicioFiscal {
  id: string;
  anio: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'activo' | 'inactivo' | 'cerrado';
  descripcion?: string;
  creado_por?: string;
  creado_por_nombre?: string;
  meses_cerrados_operativo?: number;
  meses_cerrados_contable?: number;
  created_at: string;
  updated_at: string;
}

export interface ZonaDetalle {
  zona_id: string;
  zona_nombre: string;
  operativo_cerrado: boolean;
  operativo_fecha_cierre?: string;
  contable_cerrado: boolean;
  contable_fecha_cierre?: string;
}

export interface PeriodoMensual {
  mes: number;
  zonas_detalle: ZonaDetalle[];
  cerrado_operativo: boolean;
  cerrado_contable: boolean;
  total_reportes: number;
  total_gastos: number;
  total_entregas: number;
}

const ejerciciosService = {
  // Obtener todos los ejercicios (admin)
  async getAll(): Promise<EjercicioFiscal[]> {
    const response = await api.get('/ejercicios');
    return response.data.data;
  },

  // Obtener solo ejercicios activos (para filtros)
  async getActivos(): Promise<EjercicioFiscal[]> {
    const response = await api.get('/ejercicios/activos');
    return response.data.data;
  },

  // Crear nuevo ejercicio
  async create(data: { anio: number; nombre: string; descripcion?: string }): Promise<EjercicioFiscal> {
    const response = await api.post('/ejercicios', data);
    return response.data.data;
  },

  // Actualizar estado de ejercicio
  async updateEstado(id: string, estado: 'activo' | 'inactivo' | 'cerrado'): Promise<EjercicioFiscal> {
    const response = await api.patch(`/ejercicios/${id}/estado`, { estado });
    return response.data.data;
  },

  // Obtener periodos mensuales de un ejercicio
  async getPeriodos(anio: number): Promise<PeriodoMensual[]> {
    const response = await api.get(`/ejercicios/${anio}/periodos`);
    return response.data.data;
  },

  // Cerrar periodo operativo de una zona
  async cerrarPeriodoOperativo(zona_id: string, anio: number, mes: number): Promise<void> {
    await api.post('/ejercicios/periodos/operativo/cerrar', { zona_id, anio, mes });
  },

  // Reabrir periodo operativo de una zona
  async reabrirPeriodoOperativo(zona_id: string, anio: number, mes: number): Promise<void> {
    await api.post('/ejercicios/periodos/operativo/reabrir', { zona_id, anio, mes });
  },

  // Cerrar periodo contable de una zona
  async cerrarPeriodoContable(zona_id: string, anio: number, mes: number, observaciones?: string): Promise<void> {
    await api.post('/ejercicios/periodos/contable/cerrar', { zona_id, anio, mes, observaciones });
  },

  // Reabrir periodo contable de una zona
  async reabrirPeriodoContable(zona_id: string, anio: number, mes: number): Promise<void> {
    await api.post('/ejercicios/periodos/contable/reabrir', { zona_id, anio, mes });
  },

  // Verificar estado del periodo operativo
  async verificarEstadoPeriodoOperativo(zona_id: string, anio: number, mes: number): Promise<{
    esta_cerrado: boolean;
    fecha_cierre?: string;
    cerrado_por?: string;
    mensaje: string;
  }> {
    const response = await api.get('/ejercicios/periodos/operativo/estado', {
      params: { zona_id, anio, mes }
    });
    return response.data.data;
  },

  // Verificar estado del periodo contable
  async verificarEstadoPeriodoContable(zona_id: string, anio: number, mes: number): Promise<{
    esta_cerrado: boolean;
    fecha_cierre?: string;
    cerrado_por?: string;
    mensaje: string;
  }> {
    const response = await api.get('/ejercicios/periodos/contable/estado', {
      params: { zona_id, anio, mes }
    });
    return response.data.data;
  }
};

export default ejerciciosService;
