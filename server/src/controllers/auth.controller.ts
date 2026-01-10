import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/database.js'
import { Role, User } from '../types/auth.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' })
      }

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Credenciales inválidas' })
      }

      const user = result.rows[0]

      // Verificar contraseña
      if (!user.password_hash) {
        return res.status(401).json({ message: 'Este usuario requiere autenticación OAuth' })
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' })
      }

      // Obtener el rol desde la tabla roles (usar role_id si existe, sino usar role como fallback)
      let roleCodigo: string = user.role || ''
      if (user.role_id) {
        const roleResult = await pool.query(
          'SELECT codigo FROM roles WHERE id = $1 AND activo = true',
          [user.role_id]
        )
        if (roleResult.rows.length > 0) {
          roleCodigo = roleResult.rows[0].codigo
        }
      }

      // Obtener estaciones y zonas asignadas
      const estacionesResult = await pool.query(
        'SELECT estacion_id FROM user_estaciones WHERE user_id = $1',
        [user.id]
      )
      const zonasResult = await pool.query(
        'SELECT zona_id FROM user_zonas WHERE user_id = $1',
        [user.id]
      )

      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleCodigo as Role,
        estaciones: estacionesResult.rows.map((r) => r.estacion_id),
        zonas: zonasResult.rows.map((r) => r.zona_id),
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: '7d' }
      )

      res.json({
        token,
        user: userData,
      })
    } catch (error) {
      console.error('Error en login:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const result = await pool.query('SELECT * FROM users WHERE id = $1', [
        req.user.id,
      ])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }

      const user = result.rows[0]

      // Obtener el rol desde la tabla roles (usar role_id si existe, sino usar role como fallback)
      let roleCodigo: string = user.role || ''
      if (user.role_id) {
        const roleResult = await pool.query(
          'SELECT codigo FROM roles WHERE id = $1 AND activo = true',
          [user.role_id]
        )
        if (roleResult.rows.length > 0) {
          roleCodigo = roleResult.rows[0].codigo
        }
      }

      const estacionesResult = await pool.query(
        'SELECT estacion_id FROM user_estaciones WHERE user_id = $1',
        [user.id]
      )
      const zonasResult = await pool.query(
        'SELECT zona_id FROM user_zonas WHERE user_id = $1',
        [user.id]
      )

      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleCodigo as Role,
        estaciones: estacionesResult.rows.map((r) => r.estacion_id),
        zonas: zonasResult.rows.map((r) => r.zona_id),
      }

      res.json(userData)
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async googleAuth(req: Request, res: Response) {
    // Implementar OAuth con Google
    res.redirect('/api/auth/google/callback')
  },

  async googleCallback(req: Request, res: Response) {
    // Implementar callback de Google OAuth
    res.json({ message: 'Google OAuth callback - Implementar' })
  },

  async githubAuth(req: Request, res: Response) {
    // Implementar OAuth con GitHub
    res.redirect('/api/auth/github/callback')
  },

  async githubCallback(req: Request, res: Response) {
    // Implementar callback de GitHub OAuth
    res.json({ message: 'GitHub OAuth callback - Implementar' })
  },
}

