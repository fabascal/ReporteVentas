import { Response } from 'express';
import { pool } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export const ejerciciosController = {
  // Obtener todos los ejercicios (admin)
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          e.*,
          u.name as creado_por_nombre,
          0 as meses_cerrados_operativo,
          0 as meses_cerrados_contable
        FROM ejercicios_fiscales e
        LEFT JOIN users u ON e.creado_por = u.id
        ORDER BY e.anio DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('[getEjercicios] Error:', error);
      res.status(500).json({ error: 'Error al obtener ejercicios fiscales' });
    }
  },

  // Obtener solo ejercicios activos (para filtros en toda la app)
  getActivos: async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT anio, nombre, fecha_inicio, fecha_fin
        FROM ejercicios_fiscales
        WHERE estado = 'activo'
        ORDER BY anio DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('[getEjerciciosActivos] Error:', error);
      res.status(500).json({ error: 'Error al obtener ejercicios activos' });
    }
  },

  // Crear nuevo ejercicio fiscal
  create: async (req: AuthRequest, res: Response) => {
    try {
      const { anio, nombre, descripcion } = req.body;
      const usuario = req.user;

      if (!anio || !nombre) {
        return res.status(400).json({ error: 'Año y nombre son requeridos' });
      }

      // Verificar que el año no exista
      const existe = await pool.query(
        'SELECT id FROM ejercicios_fiscales WHERE anio = $1',
        [anio]
      );

      if (existe.rows.length > 0) {
        return res.status(400).json({ error: `El ejercicio fiscal ${anio} ya existe` });
      }

      // Crear ejercicio
      const result = await pool.query(`
        INSERT INTO ejercicios_fiscales (
          anio, nombre, fecha_inicio, fecha_fin, estado, descripcion, creado_por
        ) VALUES (
          $1, $2, $3, $4, 'activo', $5, $6
        )
        RETURNING *
      `, [
        anio,
        nombre,
        `${anio}-01-01`,
        `${anio}-12-31`,
        descripcion || null,
        usuario?.id
      ]);

      res.json({
        success: true,
        message: `Ejercicio fiscal ${anio} creado exitosamente`,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('[createEjercicio] Error:', error);
      res.status(500).json({ error: 'Error al crear ejercicio fiscal' });
    }
  },

  // Actualizar estado del ejercicio
  updateEstado: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!['activo', 'inactivo', 'cerrado'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const result = await pool.query(`
        UPDATE ejercicios_fiscales
        SET estado = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [estado, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Ejercicio no encontrado' });
      }

      res.json({
        success: true,
        message: `Ejercicio actualizado a estado: ${estado}`,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('[updateEstadoEjercicio] Error:', error);
      res.status(500).json({ error: 'Error al actualizar ejercicio' });
    }
  },

  // Obtener detalle de periodos mensuales de un ejercicio
  getPeriodos: async (req: AuthRequest, res: Response) => {
    try {
      const { anio } = req.params;

      // Obtener cierres operativos y contables por mes con detalle de zonas
      const result = await pool.query(`
        SELECT 
          mes_num as mes,
          -- Detalle de cierres operativos por zona
          (SELECT json_agg(json_build_object(
            'zona_id', z.id,
            'zona_nombre', z.nombre,
            'operativo_cerrado', COALESCE(zpc.esta_cerrado, false),
            'operativo_fecha_cierre', zpc.fecha_cierre,
            'contable_cerrado', COALESCE(lm.estado = 'cerrado', false),
            'contable_fecha_cierre', lm.fecha_cierre
          ) ORDER BY z.nombre)
           FROM zonas z
           LEFT JOIN (
             SELECT zpc.zona_id, zpc.esta_cerrado, zpc.fecha_cierre
             FROM zonas_periodos_cierre zpc
             JOIN periodos_mensuales pm ON zpc.periodo_id = pm.id
             WHERE pm.anio = $1::integer AND pm.mes = mes_num
           ) zpc ON z.id = zpc.zona_id
           LEFT JOIN (
             SELECT zona_id, estado, fecha_cierre
             FROM liquidaciones_mensuales
             WHERE anio = $1::integer AND mes = mes_num AND zona_id IS NOT NULL
           ) lm ON z.id = lm.zona_id
           WHERE z.activa = true
          ) as zonas_detalle,
          -- Resumen global
          (SELECT 
            (SELECT COUNT(*) FROM zonas WHERE activa = true) > 0 
            AND 
            (SELECT COUNT(*) 
             FROM zonas_periodos_cierre zpc
             JOIN periodos_mensuales pm ON zpc.periodo_id = pm.id
             JOIN zonas z ON zpc.zona_id = z.id
             WHERE pm.anio = $1::integer AND pm.mes = mes_num AND zpc.esta_cerrado = true AND z.activa = true
            ) = (SELECT COUNT(*) FROM zonas WHERE activa = true)
          ) as cerrado_operativo,
          -- Cierre contable: todas las zonas activas deben tener liquidación cerrada
          (SELECT 
            (SELECT COUNT(*) FROM zonas WHERE activa = true) > 0 
            AND 
            (SELECT COUNT(*) 
             FROM liquidaciones_mensuales lm
             JOIN zonas z ON lm.zona_id = z.id
             WHERE lm.anio = $1::integer AND lm.mes = mes_num AND lm.estado = 'cerrado' AND z.activa = true
            ) = (SELECT COUNT(*) FROM zonas WHERE activa = true)
          ) as cerrado_contable,
          (SELECT COUNT(*) FROM reportes r 
           WHERE EXTRACT(YEAR FROM r.fecha) = $1::integer AND EXTRACT(MONTH FROM r.fecha) = mes_num) as total_reportes,
          (SELECT COUNT(*) FROM gastos g 
           WHERE EXTRACT(YEAR FROM g.fecha) = $1::integer AND EXTRACT(MONTH FROM g.fecha) = mes_num) as total_gastos,
          (SELECT COUNT(*) FROM entregas e 
           WHERE EXTRACT(YEAR FROM e.fecha) = $1::integer AND EXTRACT(MONTH FROM e.fecha) = mes_num) as total_entregas
        FROM generate_series(1, 12) as mes_num 
        ORDER BY mes_num
      `, [anio]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('[getPeriodos] Error:', error);
      res.status(500).json({ error: 'Error al obtener periodos mensuales' });
    }
  },

  // Cerrar periodo operativo de una zona
  cerrarPeriodoOperativo: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.body;
      const user_id = req.user?.id;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Obtener el periodo_id
      const periodoResult = await pool.query(
        'SELECT id FROM periodos_mensuales WHERE anio = $1 AND mes = $2',
        [anio, mes]
      );

      if (periodoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Periodo no encontrado' });
      }

      const periodo_id = periodoResult.rows[0].id;

      // Verificar si ya existe un cierre
      const existingClose = await pool.query(
        'SELECT id FROM zonas_periodos_cierre WHERE zona_id = $1 AND periodo_id = $2',
        [zona_id, periodo_id]
      );

      if (existingClose.rows.length > 0) {
        // Actualizar el cierre existente
        await pool.query(
          `UPDATE zonas_periodos_cierre 
           SET esta_cerrado = true, fecha_cierre = CURRENT_TIMESTAMP, cerrado_por = $1
           WHERE zona_id = $2 AND periodo_id = $3`,
          [user_id, zona_id, periodo_id]
        );
      } else {
        // Crear nuevo cierre
        await pool.query(
          `INSERT INTO zonas_periodos_cierre (zona_id, periodo_id, fecha_cierre, cerrado_por, esta_cerrado)
           VALUES ($1, $2, CURRENT_TIMESTAMP, $3, true)`,
          [zona_id, periodo_id, user_id]
        );
      }

      res.json({ success: true, message: 'Periodo operativo cerrado exitosamente' });
    } catch (error) {
      console.error('[cerrarPeriodoOperativo] Error:', error);
      res.status(500).json({ error: 'Error al cerrar periodo operativo' });
    }
  },

  // Reabrir periodo operativo de una zona
  reabrirPeriodoOperativo: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.body;
      const user_id = req.user?.id;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Obtener el periodo_id
      const periodoResult = await pool.query(
        'SELECT id FROM periodos_mensuales WHERE anio = $1 AND mes = $2',
        [anio, mes]
      );

      if (periodoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Periodo no encontrado' });
      }

      const periodo_id = periodoResult.rows[0].id;

      // Actualizar el cierre
      await pool.query(
        `UPDATE zonas_periodos_cierre 
         SET esta_cerrado = false, reabierto_en = CURRENT_TIMESTAMP, reabierto_por = $1
         WHERE zona_id = $2 AND periodo_id = $3`,
        [user_id, zona_id, periodo_id]
      );

      res.json({ success: true, message: 'Periodo operativo reabierto exitosamente' });
    } catch (error) {
      console.error('[reabrirPeriodoOperativo] Error:', error);
      res.status(500).json({ error: 'Error al reabrir periodo operativo' });
    }
  },

  // Cerrar periodo contable (liquidación de zona)
  cerrarPeriodoContable: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes, observaciones } = req.body;
      const user_id = req.user?.id;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Verificar si existe la liquidación
      const liquidacionResult = await pool.query(
        'SELECT id FROM liquidaciones_mensuales WHERE zona_id = $1 AND anio = $2 AND mes = $3',
        [zona_id, anio, mes]
      );

      if (liquidacionResult.rows.length === 0) {
        return res.status(404).json({ error: 'No existe liquidación para esta zona en este periodo' });
      }

      // Cerrar la liquidación
      await pool.query(
        `UPDATE liquidaciones_mensuales 
         SET estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, cerrado_por = $1, observaciones = $2
         WHERE zona_id = $3 AND anio = $4 AND mes = $5`,
        [user_id, observaciones || null, zona_id, anio, mes]
      );

      res.json({ success: true, message: 'Periodo contable cerrado exitosamente' });
    } catch (error) {
      console.error('[cerrarPeriodoContable] Error:', error);
      res.status(500).json({ error: 'Error al cerrar periodo contable' });
    }
  },

  // Reabrir periodo contable (liquidación de zona)
  reabrirPeriodoContable: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.body;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Verificar si existe la liquidación
      const liquidacionResult = await pool.query(
        'SELECT id FROM liquidaciones_mensuales WHERE zona_id = $1 AND anio = $2 AND mes = $3',
        [zona_id, anio, mes]
      );

      if (liquidacionResult.rows.length === 0) {
        return res.status(404).json({ error: 'No existe liquidación para esta zona en este periodo' });
      }

      // Reabrir la liquidación
      await pool.query(
        `UPDATE liquidaciones_mensuales 
         SET estado = 'abierto', fecha_cierre = NULL
         WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
        [zona_id, anio, mes]
      );

      res.json({ success: true, message: 'Periodo contable reabierto exitosamente' });
    } catch (error) {
      console.error('[reabrirPeriodoContable] Error:', error);
      res.status(500).json({ error: 'Error al reabrir periodo contable' });
    }
  },

  // Verificar estado del periodo operativo de una zona
  verificarEstadoPeriodoOperativo: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.query;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Parámetros incompletos' });
      }

      // Obtener el periodo_id
      const periodoResult = await pool.query(
        'SELECT id FROM periodos_mensuales WHERE anio = $1 AND mes = $2',
        [anio, mes]
      );

      if (periodoResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { esta_cerrado: false, mensaje: 'Periodo no encontrado' } 
        });
      }

      const periodo_id = periodoResult.rows[0].id;

      // Verificar si el periodo está cerrado
      const cierreResult = await pool.query(
        `SELECT esta_cerrado, fecha_cierre, u.name as cerrado_por_nombre
         FROM zonas_periodos_cierre zpc
         LEFT JOIN users u ON zpc.cerrado_por = u.id
         WHERE zpc.zona_id = $1 AND zpc.periodo_id = $2`,
        [zona_id, periodo_id]
      );

      if (cierreResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { 
            esta_cerrado: false, 
            mensaje: 'Periodo operativo abierto' 
          } 
        });
      }

      const cierre = cierreResult.rows[0];
      
      res.json({ 
        success: true, 
        data: { 
          esta_cerrado: cierre.esta_cerrado,
          fecha_cierre: cierre.fecha_cierre,
          cerrado_por: cierre.cerrado_por_nombre,
          mensaje: cierre.esta_cerrado 
            ? 'Periodo operativo cerrado' 
            : 'Periodo operativo abierto'
        } 
      });
    } catch (error) {
      console.error('[verificarEstadoPeriodoOperativo] Error:', error);
      res.status(500).json({ error: 'Error al verificar estado del periodo' });
    }
  },

  // Verificar estado del periodo contable de una zona
  verificarEstadoPeriodoContable: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.query;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Parámetros incompletos' });
      }

      // Verificar si existe la liquidación
      const liquidacionResult = await pool.query(
        `SELECT lm.estado, lm.fecha_cierre, u.name as cerrado_por_nombre
         FROM liquidaciones_mensuales lm
         LEFT JOIN users u ON lm.cerrado_por = u.id
         WHERE lm.zona_id = $1 AND lm.anio = $2 AND lm.mes = $3`,
        [zona_id, anio, mes]
      );

      if (liquidacionResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { 
            esta_cerrado: false, 
            mensaje: 'No existe liquidación para este periodo' 
          } 
        });
      }

      const liquidacion = liquidacionResult.rows[0];
      const esta_cerrado = liquidacion.estado === 'cerrado';
      
      res.json({ 
        success: true, 
        data: { 
          esta_cerrado,
          fecha_cierre: liquidacion.fecha_cierre,
          cerrado_por: liquidacion.cerrado_por_nombre,
          mensaje: esta_cerrado 
            ? 'Periodo contable cerrado' 
            : 'Periodo contable abierto'
        } 
      });
    } catch (error) {
      console.error('[verificarEstadoPeriodoContable] Error:', error);
      res.status(500).json({ error: 'Error al verificar estado del periodo contable' });
    }
  }
};
