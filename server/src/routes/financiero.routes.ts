import { Router } from 'express';
import { 
  getDashboardFinanciero, 
  getAlertas, 
  registrarGasto, 
  obtenerGastos,
  registrarEntrega,
  obtenerEntregas,
  obtenerLimiteDisponible,
  obtenerResguardoEstacion,
  cerrarPeriodoContable,
  reabrirPeriodoContable
} from '../controllers/financiero.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/financiero/dashboard
 * Obtener dashboard financiero según el rol del usuario
 */
router.get('/dashboard', getDashboardFinanciero);

/**
 * GET /api/financiero/alertas
 * Obtener alertas financieras
 */
router.get('/alertas', getAlertas);

/**
 * POST /api/financiero/gastos
 * Registrar un gasto de estación o zona
 */
router.post('/gastos', registrarGasto);

/**
 * GET /api/financiero/gastos
 * Obtener gastos de una estación o zona
 */
router.get('/gastos', obtenerGastos);

/**
 * POST /api/financiero/entregas
 * Registrar una entrega (estación→zona o zona→dirección)
 */
router.post('/entregas', registrarEntrega);

/**
 * GET /api/financiero/entregas
 * Obtener entregas de una estación o zona
 */
router.get('/entregas', obtenerEntregas);

/**
 * GET /api/financiero/limite
 * Obtener límite disponible para gastos
 */
router.get('/limite', obtenerLimiteDisponible);

/**
 * GET /api/financiero/resguardo-estacion
 * Obtener resguardo de una estación en un período específico
 */
router.get('/resguardo-estacion', obtenerResguardoEstacion);

/**
 * POST /api/financiero/liquidacion/cerrar
 * Cerrar período contable (liquidación mensual)
 */
router.post('/liquidacion/cerrar', cerrarPeriodoContable);

/**
 * POST /api/financiero/liquidacion/reabrir
 * Reabrir período contable
 */
router.post('/liquidacion/reabrir', reabrirPeriodoContable);

export default router;
