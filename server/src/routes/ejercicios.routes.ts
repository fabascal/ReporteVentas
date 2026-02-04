import { Router } from 'express';
import { ejerciciosController } from '../controllers/ejercicios.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener ejercicios activos (disponible para todos los usuarios autenticados)
router.get('/activos', ejerciciosController.getActivos);

// Obtener periodos disponibles (disponible para todos los usuarios autenticados)
router.get('/periodos-disponibles', ejerciciosController.getPeriodosDisponibles);

// Obtener todos los ejercicios (solo admin)
router.get('/', ejerciciosController.getAll);

// Obtener periodos mensuales de un ejercicio
router.get('/:anio/periodos', ejerciciosController.getPeriodos);

// Crear nuevo ejercicio (solo admin)
router.post('/', ejerciciosController.create);

// Actualizar estado de ejercicio (solo admin)
router.patch('/:id/estado', ejerciciosController.updateEstado);

// Cerrar/reabrir periodos operativos y contables (solo admin)
router.post('/periodos/operativo/cerrar', ejerciciosController.cerrarPeriodoOperativo);
router.post('/periodos/operativo/reabrir', ejerciciosController.reabrirPeriodoOperativo);
router.post('/periodos/contable/cerrar', ejerciciosController.cerrarPeriodoContable);
router.post('/periodos/contable/reabrir', ejerciciosController.reabrirPeriodoContable);

// Verificar estado del periodo operativo (disponible para GerenteZona)
router.get('/periodos/operativo/estado', ejerciciosController.verificarEstadoPeriodoOperativo);

// Verificar estado del periodo contable (disponible para GerenteZona)
router.get('/periodos/contable/estado', ejerciciosController.verificarEstadoPeriodoContable);

export default router;
