import axios from 'axios';
import {
  ValidacionCierre,
  EstadoCierre,
  CierreRequest,
  ReabrirRequest,
  CierreResponse,
  ResumenMensual,
  PeriodoMensual,
  CierreConPeriodo,
  ControlFinanciero
} from '../types/cierreMensual';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: `${API_URL}/cierre-mensual`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[cierreMensualService] No se encontró token en localStorage');
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[cierreMensualService] Error 401 - No autorizado:', {
        url: error.config?.url,
        token: localStorage.getItem('token') ? 'Presente' : 'Ausente',
        message: error.response?.data?.message || error.message
      });
      // Opcional: redirigir al login si el token expiró
      if (error.response?.data?.message === 'Token inválido' || error.response?.data?.message === 'Token no proporcionado') {
        console.warn('[cierreMensualService] Token inválido o expirado, podría necesitar re-login');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Validar si una zona puede cerrar un período
 */
export const validarCierrePeriodo = async (
  zonaId: string,
  anio: number,
  mes: number
): Promise<ValidacionCierre> => {
  const response = await api.get<ValidacionCierre>(
    `/validar/${zonaId}/${anio}/${mes}`
  );
  return response.data;
};

/**
 * Obtener estado de cierre de un período
 */
export const obtenerEstadoCierre = async (
  zonaId: string,
  anio: number,
  mes: number
): Promise<EstadoCierre> => {
  const response = await api.get<EstadoCierre>(
    `/estado/${zonaId}/${anio}/${mes}`
  );
  return response.data;
};

/**
 * Cerrar un período mensual
 */
export const cerrarPeriodo = async (
  data: CierreRequest
): Promise<CierreResponse> => {
  const response = await api.post<CierreResponse>('/cerrar', data);
  return response.data;
};

/**
 * Reabrir un período cerrado (solo admin)
 */
export const reabrirPeriodo = async (
  data: ReabrirRequest
): Promise<CierreResponse> => {
  const response = await api.post<CierreResponse>('/reabrir', data);
  return response.data;
};

/**
 * Obtener resumen mensual agregado
 */
export const obtenerResumenMensual = async (
  zonaId: string,
  anio: number,
  mes: number
): Promise<ResumenMensual[]> => {
  const response = await api.get<ResumenMensual[]>(
    `/resumen/${zonaId}/${anio}/${mes}`
  );
  return response.data;
};

/**
 * Listar períodos disponibles
 */
export const listarPeriodos = async (): Promise<PeriodoMensual[]> => {
  const response = await api.get<PeriodoMensual[]>('/periodos');
  return response.data;
};

/**
 * Listar cierres de una zona
 */
export const listarCierresZona = async (
  zonaId: string
): Promise<CierreConPeriodo[]> => {
  const response = await api.get<CierreConPeriodo[]>(`/cierres/${zonaId}`);
  return response.data;
};

/**
 * Obtener control financiero de una zona para un período
 */
export const obtenerControlFinanciero = async (
  zonaId: string,
  anio: number,
  mes: number
): Promise<ControlFinanciero> => {
  const response = await api.get<ControlFinanciero>(
    `/control-financiero/${zonaId}/${anio}/${mes}`
  );
  return response.data;
};

export default {
  validarCierrePeriodo,
  obtenerEstadoCierre,
  cerrarPeriodo,
  reabrirPeriodo,
  obtenerResumenMensual,
  listarPeriodos,
  listarCierresZona,
  obtenerControlFinanciero,
};
