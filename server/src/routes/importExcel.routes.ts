import express from 'express'
import multer from 'multer'
import { importExcelController } from '../controllers/importExcel.controller.js'
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

const router = express.Router()

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos Excel
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ]
    
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'))
    }
  }
})

// Todas las rutas requieren autenticación y rol de Administrador
router.use(authenticateToken)
router.use(requireRole(Role.Administrador))

// Importar reportes desde Excel
router.post(
  '/importar',
  upload.single('archivo'),
  importExcelController.importarReportesExcel
)

export const importExcelRoutes = router
