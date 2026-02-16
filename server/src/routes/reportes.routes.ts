import express from 'express'
import { reportesController } from '../controllers/reportes.controller.js'
import { apiExternaController } from '../controllers/apiExterna.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los reportes (según el rol del usuario)
router.get('/', reportesController.getReportes)

// Obtener un reporte por ID
router.get('/:id', reportesController.getReporteById)

// Crear nuevo reporte (solo GerenteEstacion)
router.post(
  '/',
  requireRole(Role.GerenteEstacion),
  reportesController.createReporte
)

// Actualizar estado del reporte (GerenteEstacion y GerenteZona)
router.patch(
  '/:id/estado',
  requireRole(Role.GerenteEstacion, Role.GerenteZona),
  reportesController.updateEstado
)

// Actualizar reporte (GerenteEstacion si está pendiente, GerenteZona si está aprobado, o Administrador)
router.put(
  '/:id',
  requireRole(Role.GerenteEstacion, Role.GerenteZona, Role.Administrador),
  reportesController.updateReporte
)

// Sincronizar reportes desde API externa (solo Administrador)
router.post(
  '/sincronizar',
  requireRole(Role.Administrador),
  apiExternaController.sincronizarReportes
)

// Probar conexión con API externa (solo Administrador)
router.post(
  '/probar-conexion',
  requireRole(Role.Administrador),
  apiExternaController.probarConexion
)

// Sincronizar estaciones desde API externa (solo Administrador)
router.post(
  '/sincronizar-estaciones',
  requireRole(Role.Administrador),
  apiExternaController.sincronizarEstaciones
)

// Reprocesar estación específica día por día (solo Administrador)
router.post(
  '/reprocesar-estacion',
  requireRole(Role.Administrador),
  apiExternaController.reprocesarEstacion
)

// Actualizar reportes existentes con valores aleatorios (solo Administrador)
router.post(
  '/actualizar-valores-aleatorios',
  requireRole(Role.Administrador),
  reportesController.actualizarReportesConValoresAleatorios
)

// Obtener auditoría de un reporte
router.get('/:id/auditoria', reportesController.getAuditoriaReporte)

// Obtener todos los logs de reportes (solo Administrador)
router.get(
  '/logs/todos',
  requireRole(Role.Administrador),
  reportesController.getAllLogs
)

// Obtener logs del sistema (gastos, entregas, cierres) (solo Administrador)
router.get(
  '/logs/sistema',
  requireRole(Role.Administrador),
  reportesController.getLogsSistema
)

// Obtener datos de API externa para una estación y fecha específica
router.post(
  '/obtener-datos-api',
  requireRole(Role.GerenteEstacion, Role.Administrador),
  apiExternaController.obtenerDatosEstacionFecha
)

export const reportesRoutes = router

