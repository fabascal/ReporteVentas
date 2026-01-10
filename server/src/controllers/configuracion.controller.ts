import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

export const configuracionController = {
  async getConfiguracion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden ver la configuración
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para acceder a la configuración' })
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
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden actualizar la configuración
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para actualizar la configuración' })
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
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden ver la configuración de API
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para acceder a la configuración de API' })
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
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden actualizar la configuración de API
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para actualizar la configuración de API' })
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
}

