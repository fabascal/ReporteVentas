import express from 'express'
import { externalController } from '../controllers/external.controller.js'
import { authenticateExternalToken } from '../middleware/externalAuth.middleware.js'

const router = express.Router()

// Autenticación con API Key (no requiere token)
router.post('/auth', externalController.authenticate)

// Validar token
router.post('/validate', externalController.validateToken)

// Renovar token
router.post('/refresh', externalController.refreshToken)

// Endpoints protegidos (requieren token válido)
router.get('/reportes-mensuales', authenticateExternalToken, externalController.getReportesMensuales)
router.get('/eficiencia-estaciones', authenticateExternalToken, externalController.getEficienciaEstaciones)

export default router
