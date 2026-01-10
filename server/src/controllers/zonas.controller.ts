import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

export const zonasController = {
  // Obtener todas las zonas
  async getZonas(req: AuthRequest, res: Response) {
    try {
      const result = await pool.query(
        `SELECT 
          z.id,
          z.nombre,
          z.activa,
          z.created_at,
          COUNT(e.id) as total_estaciones,
          COUNT(CASE WHEN e.activa = true THEN 1 END) as estaciones_activas
        FROM zonas z
        LEFT JOIN estaciones e ON z.id = e.zona_id
        GROUP BY z.id, z.nombre, z.activa, z.created_at
        ORDER BY z.nombre`
      )

      res.json(result.rows)
    } catch (error) {
      console.error('Error al obtener zonas:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Obtener una zona por ID con sus estaciones
  async getZonaById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const zonaResult = await pool.query('SELECT * FROM zonas WHERE id = $1', [id])
      if (zonaResult.rows.length === 0) {
        return res.status(404).json({ message: 'Zona no encontrada' })
      }

      const estacionesResult = await pool.query(
        'SELECT id, nombre, activa FROM estaciones WHERE zona_id = $1 ORDER BY nombre',
        [id]
      )

      res.json({
        ...zonaResult.rows[0],
        estaciones: estacionesResult.rows,
      })
    } catch (error) {
      console.error('Error al obtener zona:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Crear nueva zona
  async createZona(req: AuthRequest, res: Response) {
    try {
      const { nombre } = req.body

      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es requerido' })
      }

      const result = await pool.query(
        'INSERT INTO zonas (nombre) VALUES ($1) RETURNING *',
        [nombre]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Error al crear zona:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Actualizar zona
  async updateZona(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { nombre, activa } = req.body

      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es requerido' })
      }

      const result = await pool.query(
        'UPDATE zonas SET nombre = $1, activa = $2 WHERE id = $3 RETURNING *',
        [nombre, activa !== undefined ? activa : true, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Zona no encontrada' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error al actualizar zona:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Eliminar zona
  async deleteZona(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar si tiene estaciones
      const estacionesResult = await pool.query('SELECT COUNT(*) FROM estaciones WHERE zona_id = $1', [id])
      if (parseInt(estacionesResult.rows[0].count) > 0) {
        return res.status(400).json({ message: 'No se puede eliminar una zona que tiene estaciones asignadas' })
      }

      const result = await pool.query('DELETE FROM zonas WHERE id = $1 RETURNING *', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Zona no encontrada' })
      }

      res.json({ message: 'Zona eliminada exitosamente' })
    } catch (error) {
      console.error('Error al eliminar zona:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },
}

