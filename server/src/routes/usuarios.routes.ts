import express from 'express'
import { usuariosController } from '../controllers/usuarios.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación y rol de Administrador
router.use(authenticateToken)
router.use(requireRole(Role.Administrador))

router.get('/', usuariosController.getUsuarios)
router.get('/zonas', usuariosController.getZonas)
router.get('/:id', usuariosController.getUsuarioById)
router.post('/', usuariosController.createUsuario)
router.put('/:id', usuariosController.updateUsuario)
router.delete('/:id', usuariosController.deleteUsuario)
router.put('/:id/estaciones', usuariosController.asignarEstaciones)
router.put('/:id/zonas', usuariosController.asignarZonas)

export const usuariosRoutes = router

