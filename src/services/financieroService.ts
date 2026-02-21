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
  tipo_entrega: 'estacion_zona' | 'zona_direccion';
  estacion_id?: string;
  zona_id?: string;
  zona_origen_id?: string;
  monto: number;
  concepto: string;
  estado_entrega?: 'pendiente_firma' | 'confirmada' | string;
  archivo_nombre?: string;
  archivo_ruta?: string;
  fecha_firma?: string;
  observaciones_firma?: string;
  destinatario_id?: string;
  destinatario_nombre?: string;
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
  tipo_entrega: 'estacion_zona' | 'zona_direccion';
  estacion_id?: string;
  zona_id?: string;
  destinatario_id?: string;
  fecha: string;
  monto: number;
  concepto?: string;
  archivo?: File;
}

interface LimiteDisponibleResponse {
  limite_gastos: number;
  gastos_acumulados: number;
  disponible_por_limite: number;
  disponible_por_resguardo: number;
  disponible: number;
  periodo: { mes: number; anio: number };
}

interface FirmanteDireccion {
  id: string;
  name: string;
  email: string;
  role: 'Direccion' | 'DirectorOperaciones' | string;
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
    const formData = new FormData();
    formData.append('tipo_entrega', data.tipo_entrega);
    if (data.estacion_id) formData.append('estacion_id', data.estacion_id);
    if (data.zona_id) formData.append('zona_id', data.zona_id);
    if (data.destinatario_id) formData.append('destinatario_id', data.destinatario_id);
    formData.append('fecha', data.fecha);
    formData.append('monto', String(data.monto));
    formData.append('concepto', data.concepto || '');
    if (data.archivo) formData.append('archivo', data.archivo);

    const response = await api.post<{ message: string; entrega: Entrega }>(
      '/financiero/entregas-con-archivo',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
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

  obtenerEntregasPendientesFirma: async (mes: number, anio: number, zona_id?: string) => {
    const params = new URLSearchParams();
    params.append('mes', mes.toString());
    params.append('anio', anio.toString());
    if (zona_id) params.append('zona_id', zona_id);

    const response = await api.get<EntregasResponse & { zona_id?: string }>(
      `/financiero/entregas/pendientes-firma?${params.toString()}`
    );
    return response.data;
  },

  obtenerFirmantesDireccion: async () => {
    const response = await api.get<{ usuarios: FirmanteDireccion[] }>(
      '/financiero/entregas/firmantes-direccion'
    );
    return response.data;
  },

  firmarEntrega: async (entregaId: string, observaciones?: string) => {
    const response = await api.post<{ message: string; entrega: Entrega }>(
      `/financiero/entregas/${entregaId}/firmar`,
      { observaciones: observaciones || '' }
    );
    return response.data;
  },

  /**
   * Verificar estado del período (abierto/cerrado)
   */
  verificarEstadoPeriodo: async (entidad_tipo: 'estacion' | 'zona', entidad_id: string, mes: number, anio: number) => {
    const params = new URLSearchParams();
    params.append('entidad_tipo', entidad_tipo);
    params.append('entidad_id', entidad_id);
    params.append('mes', mes.toString());
    params.append('anio', anio.toString());
    
    const response = await api.get<{
      periodo_abierto: boolean;
      cierre_operativo: boolean;
      cierre_contable: boolean;
      puede_registrar_gastos: boolean;
      puede_registrar_entregas: boolean;
      mensaje: string;
    }>(`/financiero/estado-periodo?${params.toString()}`);
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
