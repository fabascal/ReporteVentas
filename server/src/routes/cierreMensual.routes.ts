import { Router } from 'express';
import {
  validarCierrePeriodo,
  obtenerEstadoCierre,
  obtenerControlFinanciero,
  cerrarPeriodo,
  reabrirPeriodo,
  obtenerResumenMensual,
  listarPeriodos,
  listarCierresZona
} from '../controllers/cierreMensual.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';
import { Role } from '../types/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Solo GerenteZona y Administrador pueden acceder a funciones de cierre
router.use(requireRole(Role.GerenteZona, Role.Administrador));

// Validar si se puede cerrar un período
router.get('/validar/:zonaId/:anio/:mes', validarCierrePeriodo);

// Obtener estado de cierre de un período
router.get('/estado/:zonaId/:anio/:mes', obtenerEstadoCierre);

// Obtener control financiero de una zona para un período
router.get('/control-financiero/:zonaId/:anio/:mes', obtenerControlFinanciero);

// Cerrar un período
router.post('/cerrar', cerrarPeriodo);

// Reabrir un período (solo admin)
router.post('/reabrir', reabrirPeriodo);

// Obtener resumen mensual agregado
router.get('/resumen/:zonaId/:anio/:mes', obtenerResumenMensual);

// Listar períodos disponibles
router.get('/periodos', listarPeriodos);

// Listar cierres de una zona
router.get('/cierres/:zonaId', listarCierresZona);

export default router;
