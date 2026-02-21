import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { pool } from '../config/database.js';
import { registrarAuditoriaGeneral } from '../utils/auditoria.js';

export const ejerciciosController = {
  // Obtener todos los ejercicios
  getAll: async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT 
          id, anio, nombre, descripcion, estado, 
          fecha_inicio, fecha_fin, created_at, creado_por
        FROM ejercicios_fiscales
        ORDER BY anio DESC
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

  // Obtener ejercicios activos
  getActivos: async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT id, anio, nombre, estado
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

  // Obtener todos los periodos mensuales disponibles (generados desde ejercicios_fiscales)
  getPeriodosDisponibles: async (req: AuthRequest, res: Response) => {
    try {
      // Generar todos los meses para cada ejercicio fiscal activo
      const result = await pool.query(`
        SELECT anio, mes
        FROM ejercicios_fiscales,
        LATERAL generate_series(1, 12) AS mes
        WHERE estado = 'activo'
        ORDER BY anio DESC, mes DESC
      `);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('[getPeriodosDisponibles] Error:', error);
      res.status(500).json({ error: 'Error al obtener periodos disponibles' });
    }
  },

  // Obtener periodos mensuales de un ejercicio específico
  getPeriodos: async (req: AuthRequest, res: Response) => {
    try {
      const { anio } = req.params;

      if (!anio) {
        return res.status(400).json({ error: 'Año requerido' });
      }

      // Verificar que el ejercicio existe
      const ejercicioResult = await pool.query(
        'SELECT id, estado FROM ejercicios_fiscales WHERE anio = $1',
        [anio]
      );

      if (ejercicioResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ejercicio fiscal no encontrado' });
      }

      // Generar array de meses y obtener información de cierre para cada uno
      const mesesQuery = `
        WITH meses AS (
          SELECT generate_series(1, 12) AS mes_num
        )
        SELECT 
          mes_num as mes,
          CASE mes_num
            WHEN 1 THEN 'Enero'
            WHEN 2 THEN 'Febrero'
            WHEN 3 THEN 'Marzo'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Mayo'
            WHEN 6 THEN 'Junio'
            WHEN 7 THEN 'Julio'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Septiembre'
            WHEN 10 THEN 'Octubre'
            WHEN 11 THEN 'Noviembre'
            WHEN 12 THEN 'Diciembre'
          END as nombre,
          -- Agregar información de cada zona
          (SELECT json_agg(
            json_build_object(
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
             WHERE zpc.anio = $1::integer AND zpc.mes = mes_num
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
             JOIN zonas z ON zpc.zona_id = z.id
             WHERE zpc.anio = $1::integer AND zpc.mes = mes_num AND zpc.esta_cerrado = true AND z.activa = true
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
          ) as cerrado_contable
        FROM meses
        ORDER BY mes_num
      `;

      const result = await pool.query(mesesQuery, [anio]);

      res.json({
        success: true,
        ejercicio: ejercicioResult.rows[0],
        periodos: result.rows
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

      // Verificar que el ejercicio fiscal existe y está activo
      const ejercicioResult = await pool.query(
        'SELECT id FROM ejercicios_fiscales WHERE anio = $1 AND estado = $2',
        [anio, 'activo']
      );

      if (ejercicioResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ejercicio fiscal no encontrado o inactivo' });
      }

      // Verificar si ya existe un cierre
      const existingClose = await pool.query(
        'SELECT id FROM zonas_periodos_cierre WHERE zona_id = $1 AND anio = $2 AND mes = $3',
        [zona_id, anio, mes]
      );

      if (existingClose.rows.length > 0) {
        // Actualizar el cierre existente
        await pool.query(
          `UPDATE zonas_periodos_cierre 
           SET esta_cerrado = true, fecha_cierre = CURRENT_TIMESTAMP, cerrado_por = $1
           WHERE zona_id = $2 AND anio = $3 AND mes = $4`,
          [user_id, zona_id, anio, mes]
        );
      } else {
        // Crear nuevo cierre
        await pool.query(
          `INSERT INTO zonas_periodos_cierre (zona_id, anio, mes, fecha_cierre, cerrado_por, esta_cerrado)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, true)`,
          [zona_id, anio, mes, user_id]
        );
      }

      // Registrar en auditoría
      await registrarAuditoriaGeneral({
        entidadTipo: 'CIERRE_PERIODO',
        entidadId: zona_id,
        accion: 'CERRAR',
        usuarioId: user_id || 'sistema',
        usuarioNombre: req.user?.email || 'Sistema',
        descripcion: `Cierre operativo: ${anio}-${String(mes).padStart(2, '0')}`,
        metadata: { zona_id, anio, mes }
      });

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

      // Verificar que el ejercicio fiscal existe
      const ejercicioResult = await pool.query(
        'SELECT id FROM ejercicios_fiscales WHERE anio = $1',
        [anio]
      );

      if (ejercicioResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ejercicio fiscal no encontrado' });
      }

      // Actualizar el cierre
      await pool.query(
        `UPDATE zonas_periodos_cierre 
         SET esta_cerrado = false, reabierto_en = CURRENT_TIMESTAMP, reabierto_por = $1
         WHERE zona_id = $2 AND anio = $3 AND mes = $4`,
        [user_id, zona_id, anio, mes]
      );

      // Registrar en auditoría
      await registrarAuditoriaGeneral({
        entidadTipo: 'REAPERTURA_PERIODO',
        entidadId: zona_id,
        accion: 'REABRIR',
        usuarioId: user_id || 'sistema',
        usuarioNombre: req.user?.email || 'Sistema',
        descripcion: `Reapertura operativa: ${anio}-${String(mes).padStart(2, '0')}`,
        metadata: { zona_id, anio, mes }
      });

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

      // Verificar que está cerrado operativamente
      const cierreOperativo = await pool.query(
        `SELECT esta_cerrado FROM zonas_periodos_cierre 
         WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
        [zona_id, anio, mes]
      );

      if (cierreOperativo.rows.length === 0 || !cierreOperativo.rows[0].esta_cerrado) {
        return res.status(400).json({ 
          error: 'Debe cerrar el período operativo antes de liquidar',
          requiere_cierre_operativo: true 
        });
      }

      // Verificar si ya existe una liquidación
      const existingLiquidacion = await pool.query(
        'SELECT id, estado FROM liquidaciones_mensuales WHERE zona_id = $1 AND anio = $2 AND mes = $3',
        [zona_id, anio, mes]
      );

      if (existingLiquidacion.rows.length > 0 && existingLiquidacion.rows[0].estado === 'cerrado') {
        return res.status(400).json({ error: 'El período ya está cerrado' });
      }

      // Cerrar la liquidación
      if (existingLiquidacion.rows.length > 0) {
        await pool.query(
          `UPDATE liquidaciones_mensuales 
           SET estado = 'cerrado', fecha_cierre = CURRENT_TIMESTAMP, 
               cerrado_por = $1, observaciones = $2
           WHERE zona_id = $3 AND anio = $4 AND mes = $5`,
          [user_id, observaciones || null, zona_id, anio, mes]
        );
      } else {
        await pool.query(
          `INSERT INTO liquidaciones_mensuales 
           (zona_id, anio, mes, estado, fecha_cierre, cerrado_por, observaciones)
           VALUES ($1, $2, $3, 'cerrado', CURRENT_TIMESTAMP, $4, $5)`,
          [zona_id, anio, mes, user_id, observaciones || null]
        );
      }

      // Registrar en auditoría
      await registrarAuditoriaGeneral({
        entidadTipo: 'CIERRE_PERIODO',
        entidadId: zona_id,
        accion: 'CERRAR',
        usuarioId: user_id || 'sistema',
        usuarioNombre: req.user?.email || 'Sistema',
        descripcion: `Cierre contable: ${anio}-${String(mes).padStart(2, '0')}`,
        metadata: { zona_id, anio, mes, observaciones }
      });

      res.json({ success: true, message: 'Periodo contable cerrado exitosamente' });
    } catch (error) {
      console.error('[cerrarPeriodoContable] Error:', error);
      res.status(500).json({ error: 'Error al cerrar periodo contable' });
    }
  },

  // Reabrir periodo contable
  reabrirPeriodoContable: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.body;
      const user_id = req.user?.id;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Reabrir la liquidación usando columnas existentes en el esquema actual.
      const reopenResult = await pool.query(
        `UPDATE liquidaciones_mensuales
         SET estado = 'abierto',
             fecha_cierre = NULL,
             cerrado_por = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE zona_id = $1
           AND anio = $2
           AND mes = $3
           AND estado = 'cerrado'
         RETURNING id`,
        [zona_id, anio, mes]
      );

      if (reopenResult.rows.length === 0) {
        return res.status(400).json({ error: 'No hay liquidación cerrada para reabrir' });
      }

      // Registrar en auditoría
      await registrarAuditoriaGeneral({
        entidadTipo: 'REAPERTURA_PERIODO',
        entidadId: zona_id,
        accion: 'REABRIR',
        usuarioId: user_id || 'sistema',
        usuarioNombre: req.user?.email || 'Sistema',
        descripcion: `Reapertura contable: ${anio}-${String(mes).padStart(2, '0')}`,
        metadata: { zona_id, anio, mes }
      });

      res.json({ success: true, message: 'Periodo contable reabierto exitosamente' });
    } catch (error) {
      console.error('[reabrirPeriodoContable] Error:', error);
      res.status(500).json({ error: 'Error al reabrir periodo contable' });
    }
  },

  // Verificar estado del período operativo
  verificarEstadoPeriodoOperativo: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.query;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Parámetros incompletos' });
      }

      // Verificar cierre operativo
      const cierreOperativoResult = await pool.query(
        `SELECT esta_cerrado, fecha_cierre, observaciones
         FROM zonas_periodos_cierre
         WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
        [zona_id, parseInt(anio as string), parseInt(mes as string)]
      );

      if (cierreOperativoResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { esta_cerrado: false, mensaje: 'Periodo no encontrado' } 
        });
      }

      const cierre = cierreOperativoResult.rows[0];
      res.json({
        success: true,
        data: {
          esta_cerrado: cierre.esta_cerrado,
          fecha_cierre: cierre.fecha_cierre,
          observaciones: cierre.observaciones
        }
      });
    } catch (error) {
      console.error('[verificarEstadoPeriodoOperativo] Error:', error);
      res.status(500).json({ error: 'Error al verificar estado del periodo' });
    }
  },

  // Verificar estado del período contable
  verificarEstadoPeriodoContable: async (req: AuthRequest, res: Response) => {
    try {
      const { zona_id, anio, mes } = req.query;

      if (!zona_id || !anio || !mes) {
        return res.status(400).json({ error: 'Parámetros incompletos' });
      }

      // Verificar liquidación
      const liquidacionResult = await pool.query(
        `SELECT estado, fecha_cierre, observaciones
         FROM liquidaciones_mensuales
         WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
        [zona_id, parseInt(anio as string), parseInt(mes as string)]
      );

      if (liquidacionResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { esta_cerrado: false, mensaje: 'Liquidación no encontrada' } 
        });
      }

      const liquidacion = liquidacionResult.rows[0];
      res.json({
        success: true,
        data: {
          esta_cerrado: liquidacion.estado === 'cerrado',
          fecha_cierre: liquidacion.fecha_cierre,
          observaciones: liquidacion.observaciones
        }
      });
    } catch (error) {
      console.error('[verificarEstadoPeriodoContable] Error:', error);
      res.status(500).json({ error: 'Error al verificar estado del periodo contable' });
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

      // Calcular fechas
      const fecha_inicio = `${anio}-01-01`;
      const fecha_fin = `${anio}-12-31`;

      // Insertar ejercicio
      const result = await pool.query(
        `INSERT INTO ejercicios_fiscales 
         (anio, nombre, descripcion, fecha_inicio, fecha_fin, estado, creado_por)
         VALUES ($1, $2, $3, $4, $5, 'activo', $6)
         RETURNING *`,
        [anio, nombre, descripcion || null, fecha_inicio, fecha_fin, usuario?.id]
      );

      res.json({
        success: true,
        message: 'Ejercicio fiscal creado exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('[createEjercicio] Error:', error);
      res.status(500).json({ error: 'Error al crear ejercicio fiscal' });
    }
  },

  // Actualizar estado de ejercicio
  updateEstado: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado || !['activo', 'cerrado', 'inactivo'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      await pool.query(
        'UPDATE ejercicios_fiscales SET estado = $1 WHERE id = $2',
        [estado, id]
      );

      res.json({
        success: true,
        message: 'Estado del ejercicio actualizado exitosamente'
      });
    } catch (error) {
      console.error('[updateEstadoEjercicio] Error:', error);
      res.status(500).json({ error: 'Error al actualizar estado del ejercicio' });
    }
  }
};
