import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { backupService } from '../services/backup.service.js'
import { Role } from '../types/auth.js'

export const configuracionController = {
  ensureAdmin(req: AuthRequest, res: Response) {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' })
      return false
    }
    if (req.user.role !== Role.Administrador) {
      res.status(403).json({ message: 'No tienes permiso para acceder a la configuración' })
      return false
    }
    return true
  },

  async getConfiguracion(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const result = await pool.query('SELECT clave, valor, descripcion FROM configuracion ORDER BY clave')

      const config: Record<string, string> = {}
      result.rows.forEach((row) => {
        config[row.clave] = row.valor || ''
      })

      res.json(config)
    } catch (error) {
      console.error('Error al obtener configuración:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async updateConfiguracion(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const { configuracion } = req.body

      if (!configuracion || typeof configuracion !== 'object') {
        return res.status(400).json({ message: 'Configuración inválida' })
      }

      // Actualizar o insertar cada clave de configuración
      for (const [clave, valor] of Object.entries(configuracion)) {
        await pool.query(
          `
          INSERT INTO configuracion (clave, valor, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (clave) 
          DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
          `,
          [clave, valor || null]
        )
      }

      res.json({ message: 'Configuración actualizada exitosamente' })
    } catch (error) {
      console.error('Error al actualizar configuración:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getConfiguracionAPI(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const result = await pool.query(
        'SELECT clave, valor FROM configuracion WHERE clave IN ($1, $2)',
        ['api_usuario', 'api_contrasena']
      )

      const config = {
        apiUsuario: '',
        apiContrasena: '',
      }

      result.rows.forEach((row) => {
        if (row.clave === 'api_usuario') {
          config.apiUsuario = row.valor || ''
        } else if (row.clave === 'api_contrasena') {
          config.apiContrasena = row.valor || ''
        }
      })

      res.json(config)
    } catch (error) {
      console.error('Error al obtener configuración de API:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async updateConfiguracionAPI(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const { apiUsuario, apiContrasena } = req.body

      if (!apiUsuario || !apiContrasena) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos' })
      }

      // Actualizar o insertar configuración de API - hacer dos queries separadas
      await pool.query(
        `
        INSERT INTO configuracion (clave, valor, descripcion, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (clave) 
        DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
        `,
        ['api_usuario', apiUsuario, 'Usuario para la API externa de Combustibles']
      )

      await pool.query(
        `
        INSERT INTO configuracion (clave, valor, descripcion, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (clave) 
        DO UPDATE SET valor = $2, updated_at = CURRENT_TIMESTAMP
        `,
        ['api_contrasena', apiContrasena, 'Contraseña para la API externa de Combustibles']
      )

      res.json({ message: 'Configuración de API actualizada exitosamente' })
    } catch (error) {
      console.error('Error al actualizar configuración de API:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getBackupSettings(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const settings = await backupService.getSettings()
      res.json(settings)
    } catch (error) {
      console.error('Error al obtener configuración de respaldos:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async updateBackupSettings(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const updated = await backupService.updateSettings(req.body || {})
      res.json({
        message: 'Configuración de respaldos actualizada exitosamente',
        settings: updated,
      })
    } catch (error: any) {
      console.error('Error al actualizar configuración de respaldos:', error)
      res.status(500).json({ message: error.message || 'Error interno del servidor' })
    }
  },

  async listBackups(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const backups = await backupService.listBackups()
      res.json({ backups })
    } catch (error) {
      console.error('Error al listar respaldos:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async createManualBackup(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const backup = await backupService.createBackup({
        mode: 'manual',
        requestedBy: req.user?.id,
      })
      res.json({
        message: 'Respaldo creado exitosamente',
        backup,
      })
    } catch (error: any) {
      console.error('Error al crear respaldo manual:', error)
      res.status(500).json({ message: error.message || 'Error interno del servidor' })
    }
  },

  async downloadBackup(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const fileName = req.params.fileName
      const filePath = backupService.resolveBackupPath(fileName)
      res.download(filePath, fileName)
    } catch (error: any) {
      console.error('Error al descargar respaldo:', error)
      res.status(400).json({ message: error.message || 'No se pudo descargar el respaldo' })
    }
  },

  async deleteBackup(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const fileName = req.params.fileName
      await backupService.deleteBackup(fileName)
      res.json({ message: 'Respaldo eliminado exitosamente' })
    } catch (error: any) {
      console.error('Error al eliminar respaldo:', error)
      res.status(400).json({ message: error.message || 'No se pudo eliminar el respaldo' })
    }
  },

  async restoreBackup(req: AuthRequest, res: Response) {
    try {
      if (!configuracionController.ensureAdmin(req, res)) {
        return
      }

      const { confirmacion } = req.body || {}
      if (confirmacion !== 'RESTAURAR') {
        return res.status(400).json({
          message: 'Confirmación inválida. Envía confirmacion="RESTAURAR".',
        })
      }

      const fileName = req.params.fileName
      await backupService.restoreBackup(fileName)

      res.json({
        message: 'Respaldo restaurado exitosamente. Recarga la aplicación para ver cambios.',
      })
    } catch (error: any) {
      console.error('Error al restaurar respaldo:', error)
      res.status(500).json({ message: error.message || 'Error al restaurar respaldo' })
    }
  },
}

