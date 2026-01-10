import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { Role } from '../types/auth.js'

export const productosController = {
  async getProductos(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const result = await pool.query(
        'SELECT id, nombre_api, nombre_display, tipo_producto, activo, created_at, updated_at FROM productos_catalogo ORDER BY tipo_producto, nombre_display'
      )

      res.json(result.rows)
    } catch (error) {
      console.error('Error al obtener productos:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getProductoById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { id } = req.params
      const result = await pool.query(
        'SELECT id, nombre_api, nombre_display, tipo_producto, activo, created_at, updated_at FROM productos_catalogo WHERE id = $1',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error al obtener producto:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async createProducto(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== Role.Administrador) {
        return res.status(403).json({ message: 'Solo los administradores pueden crear productos' })
      }

      const { nombre_api, nombre_display, tipo_producto, activo } = req.body

      if (!nombre_api || !nombre_display || !tipo_producto) {
        return res.status(400).json({ message: 'nombre_api, nombre_display y tipo_producto son requeridos' })
      }

      if (!['premium', 'magna', 'diesel'].includes(tipo_producto)) {
        return res.status(400).json({ message: 'tipo_producto debe ser premium, magna o diesel' })
      }

      const result = await pool.query(
        `INSERT INTO productos_catalogo (nombre_api, nombre_display, tipo_producto, activo, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING id, nombre_api, nombre_display, tipo_producto, activo, created_at, updated_at`,
        [nombre_api, nombre_display, tipo_producto, activo !== undefined ? activo : true]
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      console.error('Error al crear producto:', error)
      if (error.code === '23505') {
        // Unique violation
        return res.status(400).json({ message: 'Ya existe un producto con ese nombre_api' })
      }
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async updateProducto(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== Role.Administrador) {
        return res.status(403).json({ message: 'Solo los administradores pueden actualizar productos' })
      }

      const { id } = req.params
      const { nombre_api, nombre_display, tipo_producto, activo } = req.body

      if (tipo_producto && !['premium', 'magna', 'diesel'].includes(tipo_producto)) {
        return res.status(400).json({ message: 'tipo_producto debe ser premium, magna o diesel' })
      }

      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (nombre_api !== undefined) {
        updates.push(`nombre_api = $${paramCount}`)
        values.push(nombre_api)
        paramCount++
      }
      if (nombre_display !== undefined) {
        updates.push(`nombre_display = $${paramCount}`)
        values.push(nombre_display)
        paramCount++
      }
      if (tipo_producto !== undefined) {
        updates.push(`tipo_producto = $${paramCount}`)
        values.push(tipo_producto)
        paramCount++
      }
      if (activo !== undefined) {
        updates.push(`activo = $${paramCount}`)
        values.push(activo)
        paramCount++
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No hay campos para actualizar' })
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(id)

      const result = await pool.query(
        `UPDATE productos_catalogo 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, nombre_api, nombre_display, tipo_producto, activo, created_at, updated_at`,
        values
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' })
      }

      res.json(result.rows[0])
    } catch (error: any) {
      console.error('Error al actualizar producto:', error)
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Ya existe un producto con ese nombre_api' })
      }
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async deleteProducto(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== Role.Administrador) {
        return res.status(403).json({ message: 'Solo los administradores pueden eliminar productos' })
      }

      const { id } = req.params

      const result = await pool.query('DELETE FROM productos_catalogo WHERE id = $1 RETURNING id', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Producto no encontrado' })
      }

      res.json({ message: 'Producto eliminado exitosamente' })
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },
}

