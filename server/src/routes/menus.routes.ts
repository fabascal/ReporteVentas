import express from 'express'
import { menusController } from '../controllers/menus.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener menús por rol (público para todos los usuarios autenticados)
router.get('/by-role/:role', menusController.getMenusByRole)

// Rutas de administración (solo Administrador)
router.use(requireRole(Role.Administrador))

router.get('/', menusController.getMenus)
router.get('/:id', menusController.getMenuById)
router.post('/', menusController.createMenu)
router.put('/:id', menusController.updateMenu)
router.delete('/:id', menusController.deleteMenu)

export { router as menusRoutes }

