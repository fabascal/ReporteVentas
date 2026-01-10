import express from 'express'
import { zonasController } from '../controllers/zonas.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', zonasController.getZonas)
router.get('/:id', zonasController.getZonaById)
router.post('/', requireRole(Role.Administrador), zonasController.createZona)
router.put('/:id', requireRole(Role.Administrador), zonasController.updateZona)
router.delete('/:id', requireRole(Role.Administrador), zonasController.deleteZona)

export const zonasRoutes = router

