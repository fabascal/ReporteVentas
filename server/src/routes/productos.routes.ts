import express from 'express'
import { productosController } from '../controllers/productos.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

router.use(authenticateToken)
router.get('/', productosController.getProductos)
router.get('/:id', productosController.getProductoById)
router.post('/', requireRole(Role.Administrador), productosController.createProducto)
router.put('/:id', requireRole(Role.Administrador), productosController.updateProducto)
router.delete('/:id', requireRole(Role.Administrador), productosController.deleteProducto)

export const productosRoutes = router

