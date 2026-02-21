import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { 
  getDashboardFinanciero, 
  getAlertas, 
  registrarGasto, 
  obtenerGastos,
  registrarEntrega,
  obtenerEntregas,
  obtenerEntregasPendientesFirma,
  obtenerFirmantesDireccion,
  firmarEntrega,
  verificarEstadoPeriodo,
  obtenerLimiteDisponible,
  obtenerResguardoEstacion,
  cerrarPeriodoContable,
  reabrirPeriodoContable
} from '../controllers/financiero.controller.js';
import { authenticateToken, requireMenuAccess } from '../middleware/auth.middleware.js';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads', 'entregas');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/financiero/dashboard
 * Obtener dashboard financiero según el rol del usuario
 */
router.get('/dashboard', requireMenuAccess('/dashboard-financiero'), getDashboardFinanciero);

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
router.post('/entregas-con-archivo', upload.single('archivo'), registrarEntrega);
router.get('/entregas/firmantes-direccion', obtenerFirmantesDireccion);
router.get('/entregas/pendientes-firma', obtenerEntregasPendientesFirma);
router.post('/entregas/:id/firmar', firmarEntrega);

/**
 * GET /api/financiero/entregas
 * Obtener entregas de una estación o zona
 */
router.get('/entregas', obtenerEntregas);

/**
 * GET /api/financiero/estado-periodo
 * Verificar si un período está abierto o cerrado
 */
router.get('/estado-periodo', verificarEstadoPeriodo);

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
