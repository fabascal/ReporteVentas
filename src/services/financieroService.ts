import api from '../config/axios';

interface DashboardResponse {
  tipo: 'gerente_estacion' | 'gerente_zona' | 'director' | 'admin';
  data: any;
}

interface AlertasResponse {
  criticos: any[];
  advertencia: any[];
}

interface Gasto {
  id: string;
  fecha: string;
  tipo_gasto: 'estacion' | 'zona';
  estacion_id?: string;
  zona_id?: string;
  monto: number;
  concepto: string;
  categoria: string;
  capturado_por: string;
  estacion_nombre?: string;
  capturado_por_nombre?: string;
  created_at: string;
}

interface GastosResponse {
  gastos: Gasto[];
  total: number;
}

interface RegistrarGastoData {
  estacion_id?: string;
  zona_id?: string;
  fecha: string;
  monto: number;
  concepto: string;
  categoria?: string;
}

interface Entrega {
  id: string;
  fecha: string;
  tipo_entrega: 'estacion_a_zona' | 'zona_a_direccion';
  estacion_id?: string;
  zona_id?: string;
  zona_origen_id?: string;
  monto: number;
  concepto: string;
  registrado_por: string;
  estacion_nombre?: string;
  zona_nombre?: string;
  registrado_por_nombre?: string;
  created_at: string;
}

interface EntregasResponse {
  entregas: Entrega[];
  total: number;
}

interface RegistrarEntregaData {
  tipo_entrega: 'estacion_a_zona' | 'zona_a_direccion';
  estacion_id?: string;
  zona_id: string;
  fecha: string;
  monto: number;
  concepto?: string;
}

interface LimiteDisponibleResponse {
  limite_gastos: number;
  gastos_acumulados: number;
  disponible: number;
  periodo: { mes: number; anio: number };
}

export const financieroService = {
  /**
   * Obtener dashboard financiero según el rol del usuario
   */
  getDashboard: async (mes?: number, anio?: number): Promise<DashboardResponse> => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes.toString());
    if (anio) params.append('anio', anio.toString());
    
    const response = await api.get<DashboardResponse>(
      `/financiero/dashboard${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  /**
   * Obtener alertas financieras
   */
  getAlertas: async (mes?: number, anio?: number): Promise<AlertasResponse> => {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes.toString());
    if (anio) params.append('anio', anio.toString());
    
    const response = await api.get<AlertasResponse>(
      `/financiero/alertas${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  /**
   * Registrar un gasto de estación
   */
  registrarGasto: async (data: RegistrarGastoData): Promise<{ message: string; gasto: Gasto }> => {
    const response = await api.post<{ message: string; gasto: Gasto }>(
      '/financiero/gastos',
      data
    );
    return response.data;
  },

  /**
   * Obtener gastos de una estación o zona
   */
  obtenerGastos: async (estacion_id?: string, zona_id?: string, mes?: number, anio?: number): Promise<GastosResponse> => {
    const params = new URLSearchParams();
    if (estacion_id) params.append('estacion_id', estacion_id);
    if (zona_id) params.append('zona_id', zona_id);
    if (mes) params.append('mes', mes.toString());
    if (anio) params.append('anio', anio.toString());
    
    const response = await api.get<GastosResponse>(
      `/financiero/gastos?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Registrar una entrega
   */
  registrarEntrega: async (data: RegistrarEntregaData): Promise<{ message: string; entrega: Entrega }> => {
    const response = await api.post<{ message: string; entrega: Entrega }>(
      '/financiero/entregas',
      data
    );
    return response.data;
  },

  /**
   * Obtener entregas de una estación o zona
   */
  obtenerEntregas: async (estacion_id?: string, zona_id?: string, mes?: number, anio?: number): Promise<EntregasResponse> => {
    const params = new URLSearchParams();
    if (estacion_id) params.append('estacion_id', estacion_id);
    if (zona_id) params.append('zona_id', zona_id);
    if (mes) params.append('mes', mes.toString());
    if (anio) params.append('anio', anio.toString());
    
    const response = await api.get<EntregasResponse>(
      `/financiero/entregas?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener límite disponible para gastos
   */
  obtenerLimiteDisponible: async (entidad_tipo: 'estacion' | 'zona', entidad_id: string, mes?: number, anio?: number): Promise<LimiteDisponibleResponse> => {
    const params = new URLSearchParams();
    params.append('entidad_tipo', entidad_tipo);
    params.append('entidad_id', entidad_id);
    if (mes) params.append('mes', mes.toString());
    if (anio) params.append('anio', anio.toString());
    
    const response = await api.get<LimiteDisponibleResponse>(
      `/financiero/limite?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Obtener resguardo de una estación en un período específico
   */
  obtenerResguardoEstacion: async (estacion_id: string, mes: number, anio: number) => {
    const params = new URLSearchParams();
    params.append('estacion_id', estacion_id);
    params.append('mes', mes.toString());
    params.append('anio', anio.toString());
    
    const response = await api.get<{
      estacion_id: string;
      estacion_nombre: string;
      merma_generada: number;
      entregas_realizadas: number;
      gastos_realizados: number;
      saldo_resguardo: number;
      periodo: { mes: number; anio: number };
    }>(`/financiero/resguardo-estacion?${params.toString()}`);
    return response.data;
  },

  /**
   * Cerrar período contable (liquidación mensual)
   */
  cerrarPeriodoContable: async (mes: number, anio: number, observaciones?: string) => {
    const response = await api.post('/financiero/liquidacion/cerrar', {
      mes,
      anio,
      observaciones
    });
    return response.data;
  },

  /**
   * Reabrir período contable
   */
  reabrirPeriodoContable: async (mes: number, anio: number, motivo: string) => {
    const response = await api.post('/financiero/liquidacion/reabrir', {
      mes,
      anio,
      motivo
    });
    return response.data;
  },
};

export default financieroService;
