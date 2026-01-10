import express from 'express'
import { estacionesController } from '../controllers/estaciones.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', estacionesController.getEstaciones)
router.get('/:id', estacionesController.getEstacionById)
router.post('/', requireRole(Role.Administrador), estacionesController.createEstacion)
router.put('/:id', requireRole(Role.Administrador), estacionesController.updateEstacion)
router.delete('/:id', requireRole(Role.Administrador), estacionesController.deleteEstacion)

export const estacionesRoutes = router

