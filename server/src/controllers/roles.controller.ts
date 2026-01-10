import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

export interface Role {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
  orden: number
  created_at: Date
  updated_at: Date
}

export interface CreateRoleData {
  codigo: string
  nombre: string
  descripcion?: string
  activo?: boolean
  orden?: number
}

export interface UpdateRoleData {
  codigo?: string
  nombre?: string
  descripcion?: string
  activo?: boolean
  orden?: number
}

export const rolesController = {
  // Listar todos los roles
  async getRoles(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo Administrador puede ver todos los roles
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para ver roles' })
      }

      const result = await pool.query(
        `SELECT id, codigo, nombre, descripcion, activo, orden, created_at, updated_at
         FROM roles
         ORDER BY orden ASC, nombre ASC`
      )

      res.json(result.rows)
    } catch (error) {
      console.error('Error al obtener roles:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Obtener un rol por ID
  async getRoleById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para ver roles' })
      }

      const { id } = req.params

      const result = await pool.query(
        `SELECT id, codigo, nombre, descripcion, activo, orden, created_at, updated_at
         FROM roles
         WHERE id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Rol no encontrado' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error al obtener rol:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Obtener un rol por código
  async getRoleByCodigo(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { codigo } = req.params

      const result = await pool.query(
        `SELECT id, codigo, nombre, descripcion, activo, orden, created_at, updated_at
         FROM roles
         WHERE codigo = $1 AND activo = true`,
        [codigo]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Rol no encontrado' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error al obtener rol por código:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Crear nuevo rol
  async createRole(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden crear roles' })
      }

      const { codigo, nombre, descripcion, activo = true, orden = 0 }: CreateRoleData = req.body

      if (!codigo || !nombre) {
        return res.status(400).json({ message: 'Código y nombre son requeridos' })
      }

      // Validar que el código sea único
      const existingRole = await pool.query('SELECT id FROM roles WHERE codigo = $1', [codigo])
      if (existingRole.rows.length > 0) {
        return res.status(400).json({ message: 'Ya existe un rol con este código' })
      }

      const result = await pool.query(
        `INSERT INTO roles (codigo, nombre, descripcion, activo, orden)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, codigo, nombre, descripcion, activo, orden, created_at, updated_at`,
        [codigo, nombre, descripcion || null, activo, orden]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Error al crear rol:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Actualizar rol
  async updateRole(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden actualizar roles' })
      }

      const { id } = req.params
      const { codigo, nombre, descripcion, activo, orden }: UpdateRoleData = req.body

      // Verificar que el rol existe
      const existingRole = await pool.query('SELECT id FROM roles WHERE id = $1', [id])
      if (existingRole.rows.length === 0) {
        return res.status(404).json({ message: 'Rol no encontrado' })
      }

      // Si se está cambiando el código, validar que sea único
      if (codigo) {
        const duplicateRole = await pool.query(
          'SELECT id FROM roles WHERE codigo = $1 AND id != $2',
          [codigo, id]
        )
        if (duplicateRole.rows.length > 0) {
          return res.status(400).json({ message: 'Ya existe otro rol con este código' })
        }
      }

      // Construir query dinámico
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (codigo !== undefined) {
        updates.push(`codigo = $${paramCount++}`)
        values.push(codigo)
      }
      if (nombre !== undefined) {
        updates.push(`nombre = $${paramCount++}`)
        values.push(nombre)
      }
      if (descripcion !== undefined) {
        updates.push(`descripcion = $${paramCount++}`)
        values.push(descripcion || null)
      }
      if (activo !== undefined) {
        updates.push(`activo = $${paramCount++}`)
        values.push(activo)
      }
      if (orden !== undefined) {
        updates.push(`orden = $${paramCount++}`)
        values.push(orden)
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' })
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)

      const result = await pool.query(
        `UPDATE roles
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, codigo, nombre, descripcion, activo, orden, created_at, updated_at`,
        values
      )

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error al actualizar rol:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Eliminar rol
  async deleteRole(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden eliminar roles' })
      }

      const { id } = req.params

      // Verificar que el rol existe
      const existingRole = await pool.query('SELECT id, codigo FROM roles WHERE id = $1', [id])
      if (existingRole.rows.length === 0) {
        return res.status(404).json({ message: 'Rol no encontrado' })
      }

      // Verificar si hay usuarios con este rol
      const usersWithRole = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = $1', [id])
      if (parseInt(usersWithRole.rows[0].count) > 0) {
        return res.status(400).json({
          message: 'No se puede eliminar el rol porque hay usuarios asignados a él',
        })
      }

      await pool.query('DELETE FROM roles WHERE id = $1', [id])

      res.json({ message: 'Rol eliminado exitosamente' })
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },
}

