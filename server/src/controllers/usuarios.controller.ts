import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

export const usuariosController = {
  // Listar todos los usuarios
  async getUsuarios(req: AuthRequest, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.name,
          COALESCE(r.codigo, u.role) as role,
          u.created_at,
          u.updated_at,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object('id', e.id, 'nombre', e.nombre)) 
            FILTER (WHERE e.id IS NOT NULL),
            '[]'::json
          ) as estaciones,
          COALESCE(
            json_agg(DISTINCT jsonb_build_object('id', z.id, 'nombre', z.nombre)) 
            FILTER (WHERE z.id IS NOT NULL),
            '[]'::json
          ) as zonas
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN user_estaciones ue ON u.id = ue.user_id
        LEFT JOIN estaciones e ON ue.estacion_id = e.id
        LEFT JOIN user_zonas uz ON u.id = uz.user_id
        LEFT JOIN zonas z ON uz.zona_id = z.id
        GROUP BY u.id, u.email, u.name, r.codigo, u.role, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
      `)

      const usuarios = result.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        estaciones: Array.isArray(row.estaciones) ? row.estaciones : [],
        zonas: Array.isArray(row.zonas) ? row.zonas : [],
      }))

      res.json(usuarios)
    } catch (error) {
      console.error('Error al obtener usuarios:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Obtener un usuario por ID
  async getUsuarioById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id])

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }

      const user = userResult.rows[0]

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
        `SELECT e.id, e.nombre 
         FROM user_estaciones ue 
         JOIN estaciones e ON ue.estacion_id = e.id 
         WHERE ue.user_id = $1`,
        [id]
      )

      const zonasResult = await pool.query(
        `SELECT z.id, z.nombre 
         FROM user_zonas uz 
         JOIN zonas z ON uz.zona_id = z.id 
         WHERE uz.user_id = $1`,
        [id]
      )

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleCodigo,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        estaciones: estacionesResult.rows,
        zonas: zonasResult.rows,
      })
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Crear nuevo usuario
  async createUsuario(req: AuthRequest, res: Response) {
    try {
      const { email, password, name, role, estaciones, zonas } = req.body

      if (!email || !name || !role) {
        return res.status(400).json({ message: 'Email, nombre y rol son requeridos' })
      }

      // Obtener role_id desde el código del rol
      const roleResult = await pool.query(
        'SELECT id, codigo FROM roles WHERE codigo = $1 AND activo = true',
        [role]
      )
      if (roleResult.rows.length === 0) {
        return res.status(400).json({ message: 'Rol inválido o inactivo' })
      }
      const roleId = roleResult.rows[0].id
      const roleCodigo = roleResult.rows[0].codigo

      // Verificar si el email ya existe
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'El email ya está registrado' })
      }

      // Hash de contraseña si se proporciona
      let passwordHash = null
      if (password) {
        passwordHash = await bcrypt.hash(password, 10)
      }

      // Crear usuario usando role_id
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role_id, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email, name, role, created_at`,
        [email, passwordHash, name, roleId, roleCodigo]
      )

      const newUser = result.rows[0]

      // Asignar estaciones si se proporcionan
      if (estaciones && Array.isArray(estaciones) && estaciones.length > 0) {
        for (const estacionId of estaciones) {
          await pool.query(
            'INSERT INTO user_estaciones (user_id, estacion_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newUser.id, estacionId]
          )
        }
      }

      // Asignar zonas si se proporcionan
      if (zonas && Array.isArray(zonas) && zonas.length > 0) {
        for (const zonaId of zonas) {
          await pool.query(
            'INSERT INTO user_zonas (user_id, zona_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newUser.id, zonaId]
          )
        }
      }

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.created_at,
      })
    } catch (error) {
      console.error('Error al crear usuario:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Actualizar usuario
  async updateUsuario(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { email, password, name, role } = req.body

      // Verificar que el usuario existe
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }

      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (email !== undefined) {
        // Verificar que el email no esté en uso por otro usuario
        const emailCheck = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, id]
        )
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ message: 'El email ya está en uso' })
        }
        updates.push(`email = $${paramCount++}`)
        values.push(email)
      }

      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`)
        values.push(name)
      }

      if (role !== undefined) {
        // Obtener role_id desde el código del rol
        const roleResult = await pool.query(
          'SELECT id, codigo FROM roles WHERE codigo = $1 AND activo = true',
          [role]
        )
        if (roleResult.rows.length === 0) {
          return res.status(400).json({ message: 'Rol inválido o inactivo' })
        }
        const roleId = roleResult.rows[0].id
        const roleCodigo = roleResult.rows[0].codigo
        updates.push(`role_id = $${paramCount++}`)
        values.push(roleId)
        updates.push(`role = $${paramCount++}`)
        values.push(roleCodigo)
      }

      if (password !== undefined && password !== '') {
        const passwordHash = await bcrypt.hash(password, 10)
        updates.push(`password_hash = $${paramCount++}`)
        values.push(passwordHash)
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' })
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
      const result = await pool.query(query, values)

      res.json({
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        role: result.rows[0].role,
        updatedAt: result.rows[0].updated_at,
      })
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Eliminar usuario
  async deleteUsuario(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar que el usuario existe
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }

      // No permitir eliminar al propio usuario
      if (req.user && req.user.id === id) {
        return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' })
      }

      await pool.query('DELETE FROM users WHERE id = $1', [id])

      res.json({ message: 'Usuario eliminado exitosamente' })
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Asignar estaciones a un usuario
  async asignarEstaciones(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { estaciones } = req.body

      // Verificar que el usuario existe
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }

      // Eliminar asignaciones existentes
      await pool.query('DELETE FROM user_estaciones WHERE user_id = $1', [id])

      // Asignar nuevas estaciones
      if (estaciones && Array.isArray(estaciones) && estaciones.length > 0) {
        for (const estacionId of estaciones) {
          await pool.query(
            'INSERT INTO user_estaciones (user_id, estacion_id) VALUES ($1, $2)',
            [id, estacionId]
          )
        }
      }

      res.json({ message: 'Estaciones asignadas exitosamente' })
    } catch (error) {
      console.error('Error al asignar estaciones:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Asignar zonas a un usuario
  async asignarZonas(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { zonas } = req.body

      // Verificar que el usuario existe y obtener su rol
      const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [id])
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }

      const usuario = userResult.rows[0]

      // Eliminar asignaciones existentes
      await pool.query('DELETE FROM user_zonas WHERE user_id = $1', [id])

      // Asignar nuevas zonas
      if (zonas && Array.isArray(zonas) && zonas.length > 0) {
        for (const zonaId of zonas) {
          await pool.query(
            'INSERT INTO user_zonas (user_id, zona_id) VALUES ($1, $2)',
            [id, zonaId]
          )
        }

        // IMPORTANTE: Si el usuario es Gerente de Zona, actualizar también el campo zona_id en users
        // Este campo se usa para filtrar los reportes que puede ver el gerente
        if (usuario.role === 'GerenteZona' && zonas.length === 1) {
          await pool.query(
            'UPDATE users SET zona_id = $1, updated_at = NOW() WHERE id = $2',
            [zonas[0], id]
          )
        } else if (usuario.role === 'GerenteZona' && zonas.length === 0) {
          // Si se quitan todas las zonas, limpiar el campo zona_id
          await pool.query(
            'UPDATE users SET zona_id = NULL, updated_at = NOW() WHERE id = $1',
            [id]
          )
        }
      } else {
        // Si no se asignan zonas, limpiar el campo zona_id para Gerentes de Zona
        if (usuario.role === 'GerenteZona') {
          await pool.query(
            'UPDATE users SET zona_id = NULL, updated_at = NOW() WHERE id = $1',
            [id]
          )
        }
      }

      res.json({ message: 'Zonas asignadas exitosamente' })
    } catch (error) {
      console.error('Error al asignar zonas:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Obtener todas las zonas (para selects)
  async getZonas(req: AuthRequest, res: Response) {
    try {
      const result = await pool.query(
        'SELECT id, nombre FROM zonas WHERE activa = true ORDER BY nombre'
      )
      res.json(result.rows)
    } catch (error) {
      console.error('Error al obtener zonas:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },
}

