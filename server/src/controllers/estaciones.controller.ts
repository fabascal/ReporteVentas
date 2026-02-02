import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

export const estacionesController = {
  async getEstaciones(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      let query = `
        SELECT 
          e.id,
          e.nombre,
          e.activa,
          e.zona_id,
          e.identificador_externo,
          e.tiene_premium,
          e.tiene_magna,
          e.tiene_diesel,
          z.nombre as zona_nombre,
          z.id as zona_id
        FROM estaciones e
        JOIN zonas z ON e.zona_id = z.id
        WHERE 1=1
      `

      const params: any[] = []
      let paramCount = 1

      // Filtrar según el rol
      if (req.user.role === 'GerenteEstacion') {
        query += ` AND e.id IN (
          SELECT estacion_id FROM user_estaciones WHERE user_id = $${paramCount}
        )`
        params.push(req.user.id)
      } else if (req.user.role === 'GerenteZona') {
        // Gerente de zona ve estaciones de su zona asignada (users.zona_id)
        query += ` AND e.zona_id = (
          SELECT zona_id FROM users WHERE id = $${paramCount}
        )`
        params.push(req.user.id)
      }
      // Administrador y Dirección pueden ver todas las estaciones

      query += ` ORDER BY z.nombre, e.nombre`

      const result = await pool.query(query, params)

      const estaciones = result.rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
        activa: row.activa,
        zonaId: row.zona_id,
        zonaNombre: row.zona_nombre,
        identificadorExterno: row.identificador_externo,
        tienePremium: row.tiene_premium !== false, // Por defecto true si es null
        tieneMagna: row.tiene_magna !== false,
        tieneDiesel: row.tiene_diesel !== false,
      }))

      res.json(estaciones)
    } catch (error) {
      console.error('Error al obtener estaciones:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Obtener una estación por ID
  async getEstacionById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const result = await pool.query(
        `SELECT e.*, z.nombre as zona_nombre 
         FROM estaciones e 
         JOIN zonas z ON e.zona_id = z.id 
         WHERE e.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Estación no encontrada' })
      }

      const row = result.rows[0]
      const estacion = {
        id: row.id,
        nombre: row.nombre,
        activa: row.activa,
        zonaId: row.zona_id,
        zonaNombre: row.zona_nombre,
        identificadorExterno: row.identificador_externo,
        tienePremium: row.tiene_premium !== false,
        tieneMagna: row.tiene_magna !== false,
        tieneDiesel: row.tiene_diesel !== false,
      }

      res.json(estacion)
    } catch (error) {
      console.error('Error al obtener estación:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Crear nueva estación
  async createEstacion(req: AuthRequest, res: Response) {
    try {
      const { nombre, zona_id, identificador_externo, tiene_premium, tiene_magna, tiene_diesel } = req.body

      if (!nombre || !zona_id) {
        return res.status(400).json({ message: 'El nombre y la zona son requeridos' })
      }

      // Verificar que la zona existe
      const zonaCheck = await pool.query('SELECT id FROM zonas WHERE id = $1', [zona_id])
      if (zonaCheck.rows.length === 0) {
        return res.status(400).json({ message: 'La zona especificada no existe' })
      }

      const result = await pool.query(
        'INSERT INTO estaciones (nombre, zona_id, identificador_externo, tiene_premium, tiene_magna, tiene_diesel) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [
          nombre,
          zona_id,
          identificador_externo || null,
          tiene_premium !== undefined ? tiene_premium : true,
          tiene_magna !== undefined ? tiene_magna : true,
          tiene_diesel !== undefined ? tiene_diesel : true,
        ]
      )

      // Obtener la zona para incluirla en la respuesta
      const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [zona_id])
      const estacion = {
        id: result.rows[0].id,
        nombre: result.rows[0].nombre,
        activa: result.rows[0].activa,
        zonaId: result.rows[0].zona_id,
        zonaNombre: zonaResult.rows[0].nombre,
        identificadorExterno: result.rows[0].identificador_externo,
        tienePremium: result.rows[0].tiene_premium !== false,
        tieneMagna: result.rows[0].tiene_magna !== false,
        tieneDiesel: result.rows[0].tiene_diesel !== false,
      }

      res.status(201).json(estacion)
    } catch (error) {
      console.error('Error al crear estación:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Actualizar estación
  async updateEstacion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { nombre, zona_id, activa, identificador_externo, tiene_premium, tiene_magna, tiene_diesel } = req.body

      if (!nombre) {
        return res.status(400).json({ message: 'El nombre es requerido' })
      }

      let query = 'UPDATE estaciones SET nombre = $1'
      const params: any[] = [nombre]
      let paramCount = 2

      if (zona_id) {
        // Verificar que la zona existe
        const zonaCheck = await pool.query('SELECT id FROM zonas WHERE id = $1', [zona_id])
        if (zonaCheck.rows.length === 0) {
          return res.status(400).json({ message: 'La zona especificada no existe' })
        }
        query += `, zona_id = $${paramCount}`
        params.push(zona_id)
        paramCount++
      }

      if (activa !== undefined) {
        query += `, activa = $${paramCount}`
        params.push(activa)
        paramCount++
      }

      if (identificador_externo !== undefined) {
        query += `, identificador_externo = $${paramCount}`
        params.push(identificador_externo || null)
        paramCount++
      }

      if (tiene_premium !== undefined) {
        query += `, tiene_premium = $${paramCount}`
        params.push(tiene_premium)
        paramCount++
      }

      if (tiene_magna !== undefined) {
        query += `, tiene_magna = $${paramCount}`
        params.push(tiene_magna)
        paramCount++
      }

      if (tiene_diesel !== undefined) {
        query += `, tiene_diesel = $${paramCount}`
        params.push(tiene_diesel)
        paramCount++
      }

      query += ` WHERE id = $${paramCount} RETURNING *`
      params.push(id)

      const result = await pool.query(query, params)

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Estación no encontrada' })
      }

      // Obtener la zona para incluirla en la respuesta
      const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [
        result.rows[0].zona_id,
      ])
      const estacion = {
        id: result.rows[0].id,
        nombre: result.rows[0].nombre,
        activa: result.rows[0].activa,
        zonaId: result.rows[0].zona_id,
        zonaNombre: zonaResult.rows[0].nombre,
        identificadorExterno: result.rows[0].identificador_externo,
        tienePremium: result.rows[0].tiene_premium !== false,
        tieneMagna: result.rows[0].tiene_magna !== false,
        tieneDiesel: result.rows[0].tiene_diesel !== false,
      }

      res.json(estacion)
    } catch (error) {
      console.error('Error al actualizar estación:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  // Eliminar estación
  async deleteEstacion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar si tiene reportes
      const reportesResult = await pool.query('SELECT COUNT(*) FROM reportes WHERE estacion_id = $1', [id])
      if (parseInt(reportesResult.rows[0].count) > 0) {
        return res.status(400).json({ message: 'No se puede eliminar una estación que tiene reportes asociados' })
      }

      const result = await pool.query('DELETE FROM estaciones WHERE id = $1 RETURNING *', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Estación no encontrada' })
      }

      res.json({ message: 'Estación eliminada exitosamente' })
    } catch (error) {
      console.error('Error al eliminar estación:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },
}

