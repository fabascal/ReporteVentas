import { Router } from 'express'
import { rolesController } from '../controllers/roles.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Obtener todos los roles (solo Admin)
router.get('/', requireRole(Role.Administrador), rolesController.getRoles)

// Obtener rol por código (cualquier usuario autenticado)
router.get('/codigo/:codigo', rolesController.getRoleByCodigo)

// Obtener rol por ID (solo Admin)
router.get('/:id', requireRole(Role.Administrador), rolesController.getRoleById)

// Crear rol (solo Admin)
router.post('/', requireRole(Role.Administrador), rolesController.createRole)

// Actualizar rol (solo Admin)
router.put('/:id', requireRole(Role.Administrador), rolesController.updateRole)

// Eliminar rol (solo Admin)
router.delete('/:id', requireRole(Role.Administrador), rolesController.deleteRole)

export default router

