import { Router } from 'express'
import { configuracionController } from '../controllers/configuracion.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

export const configuracionRoutes = Router()

// Todas las rutas requieren autenticación
configuracionRoutes.use(authenticateToken)

// Obtener configuración general
configuracionRoutes.get('/', configuracionController.getConfiguracion)

// Actualizar configuración general
configuracionRoutes.put('/', configuracionController.updateConfiguracion)

// Obtener configuración de API
configuracionRoutes.get('/api', configuracionController.getConfiguracionAPI)

// Actualizar configuración de API
configuracionRoutes.put('/api', configuracionController.updateConfiguracionAPI)

// Configuración de respaldos automáticos
configuracionRoutes.get('/backups/settings', configuracionController.getBackupSettings)
configuracionRoutes.put('/backups/settings', configuracionController.updateBackupSettings)

// Gestión de respaldos
configuracionRoutes.get('/backups', configuracionController.listBackups)
configuracionRoutes.post('/backups/manual', configuracionController.createManualBackup)
configuracionRoutes.get('/backups/:fileName/download', configuracionController.downloadBackup)
configuracionRoutes.delete('/backups/:fileName', configuracionController.deleteBackup)
configuracionRoutes.post('/backups/:fileName/restore', configuracionController.restoreBackup)

