import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const authController = {
  login: async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
      // Buscar usuario
      const result = await pool.query(
        'SELECT u.*, r.codigo as role_code FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciales inválidas' })
      }

      const user = result.rows[0]

      // Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' })
      }

      // Si 2FA está habilitado, no devolver token aún, indicar que se requiere 2FA
      if (user.two_factor_enabled) {
        return res.json({
          require2FA: true,
          userId: user.id, // Enviar ID temporalmente para el siguiente paso (o usar un token temporal limitado)
          email: user.email // Opcional, para mostrar al usuario
        })
      }

      // Obtener zona_id directamente del usuario si es Gerente de Zona
      let zona_id = user.role_code === 'GerenteZona' ? user.zona_id : undefined
      
      // Obtener estaciones del usuario si es Gerente de Estación
      let estaciones = []
      if (user.role_code === 'GerenteEstacion') {
        const estacionesResult = await pool.query(
          'SELECT estacion_id FROM user_estaciones WHERE user_id = $1',
          [user.id]
        )
        estaciones = estacionesResult.rows.map(row => row.estacion_id)
      }

      // Generar token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role_code || user.role,
          name: user.name,
          zona_id: zona_id,
          estaciones: estaciones
        },
        process.env.JWT_SECRET || 'your-secret-key', // Ensure using env var if available
        { expiresIn: '24h' }
      )

      // Devolver respuesta
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role_code || user.role,
          zona_id: zona_id,
          estaciones: estaciones
        }
      })
    } catch (error) {
      console.error('Error en login:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  verify2FALogin: async (req: Request, res: Response) => {
    const { userId, token: userToken } = req.body

    try {
      const result = await pool.query(
        'SELECT u.*, r.codigo as role_code FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      const user = result.rows[0]

      if (!user.two_factor_enabled || !user.two_factor_secret) {
        return res.status(400).json({ error: '2FA no está habilitado para este usuario' })
      }

      const isValid = authenticator.verify({
        token: userToken,
        secret: user.two_factor_secret
      })

      if (!isValid) {
        return res.status(401).json({ error: 'Código 2FA inválido' })
      }

      // Generar token igual que en login
      // Obtener zona_id directamente del usuario si es Gerente de Zona
      let zona_id = user.role_code === 'GerenteZona' ? user.zona_id : undefined
      
      let estaciones = []
      if (user.role_code === 'GerenteEstacion') {
        const estacionesResult = await pool.query(
          'SELECT estacion_id FROM user_estaciones WHERE user_id = $1',
          [user.id]
        )
        estaciones = estacionesResult.rows.map(row => row.estacion_id)
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role_code || user.role,
          name: user.name,
          zona_id: zona_id,
          estaciones: estaciones
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      )

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role_code || user.role,
          zona_id: zona_id,
          estaciones: estaciones
        }
      })

    } catch (error) {
      console.error('Error verificando 2FA login:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  getCurrentUser: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      const result = await pool.query(
        'SELECT u.id, u.email, u.name, r.codigo as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
        [req.user.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      const user = result.rows[0]
      
      // Obtener datos adicionales según rol
      // Obtener zona_id directamente del usuario si es Gerente de Zona
      let zona_id = user.role === 'GerenteZona' ? user.zona_id : undefined
      let estaciones = []
      
      if (user.role === 'GerenteEstacion') {
        const estacionesResult = await pool.query(
          'SELECT estacion_id FROM user_estaciones WHERE user_id = $1',
          [user.id]
        )
        estaciones = estacionesResult.rows.map(row => row.estacion_id)
      }

      res.json({
        ...user,
        zona_id,
        estaciones
      })
    } catch (error) {
      console.error('Error getting current user:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  get2FAStatus: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autenticado' })

      const result = await pool.query(
        'SELECT two_factor_enabled FROM users WHERE id = $1',
        [req.user.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      res.json({ enabled: result.rows[0].two_factor_enabled || false })
    } catch (error) {
      console.error('Error getting 2FA status:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  setup2FA: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autenticado' })

      const secret = authenticator.generateSecret()
      const otpauth = authenticator.keyuri(req.user.email, 'RepVtas', secret)
      const imageUrl = await qrcode.toDataURL(otpauth)

      // Guardar el secreto temporalmente (o en DB pero no habilitado aún)
      await pool.query(
        'UPDATE users SET two_factor_secret = $1, two_factor_enabled = false WHERE id = $2',
        [secret, req.user.id]
      )

      res.json({ secret, qrCodeUrl: imageUrl })
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  confirm2FA: async (req: AuthRequest, res: Response) => {
    const { token } = req.body
    
    try {
      if (!req.user) return res.status(401).json({ error: 'No autenticado' })

      const result = await pool.query(
        'SELECT two_factor_secret FROM users WHERE id = $1',
        [req.user.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }

      const secret = result.rows[0].two_factor_secret
      if (!secret) {
        return res.status(400).json({ error: 'No se ha iniciado la configuración de 2FA' })
      }

      const isValid = authenticator.verify({ token, secret })

      if (isValid) {
        await pool.query(
          'UPDATE users SET two_factor_enabled = true WHERE id = $1',
          [req.user.id]
        )
        res.json({ success: true, message: '2FA habilitado correctamente' })
      } else {
        // Log para depuración
        console.log(`[2FA] Código inválido. Token recibido: ${token}, Secret: ${secret.substring(0, 5)}...`)
        res.status(400).json({ error: 'Código inválido' })
      }
    } catch (error) {
      console.error('Error confirming 2FA:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  disable2FA: async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'No autenticado' })

      await pool.query(
        'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
        [req.user.id]
      )

      res.json({ success: true, message: '2FA deshabilitado correctamente' })
    } catch (error) {
      console.error('Error disabling 2FA:', error)
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  },

  googleAuth: async (req: Request, res: Response) => {
    // Stub
    res.status(501).json({ error: 'Not implemented' })
  },

  googleCallback: async (req: Request, res: Response) => {
    // Stub
    res.status(501).json({ error: 'Not implemented' })
  },

  githubAuth: async (req: Request, res: Response) => {
    // Stub
    res.status(501).json({ error: 'Not implemented' })
  },

  githubCallback: async (req: Request, res: Response) => {
    // Stub
    res.status(501).json({ error: 'Not implemented' })
  }
}
