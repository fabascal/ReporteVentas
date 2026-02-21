import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { registrarAuditoriaGeneral } from '../utils/auditoria.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    role: string;
    estaciones?: string[];
    zona_id?: string;
  };
}

/**
 * Obtener dashboard financiero según el rol del usuario
 */
export const getDashboardFinanciero = async (req: AuthRequest, res: Response) => {
  try {
    // Evita respuestas antiguas en proxies/navegador para tablero financiero.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    console.log('[getDashboardFinanciero] Usuario:', {
      id: usuario.id,
      role: usuario.role,
      estaciones: usuario.estaciones,
      zona_id: usuario.zona_id
    });

    // Obtener mes y año desde query params o usar el actual
    const now = new Date();
    const mes = req.query.mes ? parseInt(req.query.mes as string) : now.getMonth() + 1;
    const anio = req.query.anio ? parseInt(req.query.anio as string) : now.getFullYear();

    console.log('[getDashboardFinanciero] Período:', { mes, anio });

    // Verificar que el ejercicio fiscal existe
    const ejercicioResult = await pool.query(
      'SELECT id FROM ejercicios_fiscales WHERE anio = $1 AND estado = $2',
      [anio, 'activo']
    );

    if (ejercicioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ejercicio fiscal no encontrado o inactivo' });
    }

    // Crear objeto periodo con fechas calculadas
    const fecha_inicio = new Date(anio, mes - 1, 1);
    const fecha_fin = new Date(anio, mes, 0);
    
    const periodo = {
      anio,
      mes,
      fecha_inicio,
      fecha_fin
    };

    // Según el rol, devolver diferentes vistas
    switch (usuario.role) {
      case 'GerenteEstacion':
        return await getDashboardGerenteEstacion(usuario, periodo, res);
      
      case 'GerenteZona':
        return await getDashboardGerenteZona(usuario, periodo, res);
      
      case 'Direccion':
      case 'Administrador':
        return await getDashboardDirector(usuario, periodo, res);
      
      default:
        // Para roles nuevos, devolver la vista ejecutiva cuando tengan permiso de menú.
        return await getDashboardDirector(usuario, periodo, res);
    }
  } catch (error) {
    console.error('[getDashboardFinanciero] Error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard financiero' });
  }
};

async function obtenerSaldoInicialZona(zonaId: string, anio: number, mes: number): Promise<number> {
  const anioAnterior = anio - (mes === 1 ? 1 : 0);
  const mesAnterior = mes === 1 ? 12 : mes - 1;
  const anioBase = anioAnterior - (mesAnterior === 1 ? 1 : 0);
  const mesBase = mesAnterior === 1 ? 12 : mesAnterior - 1;

  const saldoBaseResult = await pool.query(
    `SELECT saldo_final
     FROM liquidaciones_mensuales
     WHERE zona_id = $1
       AND estacion_id IS NULL
       AND anio = $2
       AND mes = $3
       AND estado = 'cerrado'
     ORDER BY fecha_cierre DESC
     LIMIT 1`,
    [zonaId, anioBase, mesBase]
  );
  const saldoBase = parseFloat(saldoBaseResult.rows[0]?.saldo_final || '0');

  const fechaInicioAnterior = new Date(anioAnterior, mesAnterior - 1, 1);
  const fechaFinAnterior = new Date(anioAnterior, mesAnterior, 0);

  const movimientosResult = await pool.query(
    `SELECT
       COALESCE(
         (
           SELECT SUM(e.monto)
           FROM entregas e
           WHERE e.zona_id = $1
             AND e.tipo_entrega = 'estacion_zona'
             AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
             AND e.fecha >= $2
             AND e.fecha <= $3
         ),
         0
       ) AS entregas_recibidas,
       COALESCE(
         (
           SELECT SUM(e.monto)
           FROM entregas e
           WHERE e.zona_origen_id = $1
             AND e.tipo_entrega = 'zona_direccion'
             AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
             AND e.fecha >= $2
             AND e.fecha <= $3
         ),
         0
       ) AS entregas_enviadas,
       COALESCE(
         (
           SELECT SUM(g.monto)
           FROM gastos g
           WHERE g.zona_id = $1
             AND g.tipo_gasto = 'zona'
             AND g.fecha >= $2
             AND g.fecha <= $3
         ),
         0
       ) AS gastos_zona`,
    [zonaId, fechaInicioAnterior, fechaFinAnterior]
  );

  const entregasRecibidas = parseFloat(movimientosResult.rows[0]?.entregas_recibidas || '0');
  const entregasEnviadas = parseFloat(movimientosResult.rows[0]?.entregas_enviadas || '0');
  const gastosZona = parseFloat(movimientosResult.rows[0]?.gastos_zona || '0');

  return saldoBase + entregasRecibidas - entregasEnviadas - gastosZona;
}

/**
 * Dashboard para Gerente de Estación
 */
async function getDashboardGerenteEstacion(usuario: any, periodo: any, res: Response) {
  try {
    // Obtener estaciones asignadas al usuario desde la base de datos
    const estacionesAsignadasResult = await pool.query(
      `SELECT estacion_id FROM user_estaciones WHERE user_id = $1`,
      [usuario.id]
    );

    const estacionesIds = estacionesAsignadasResult.rows.map((row: any) => row.estacion_id);
    
    console.log('[getDashboardGerenteEstacion] Estaciones asignadas al usuario:', estacionesIds.length);
    
    if (estacionesIds.length === 0) {
      return res.json({
        tipo: 'gerente_estacion',
        data: {
          totales: {
            merma_total: 0,
            entregas_total: 0,
            gastos_total: 0,
            resguardo_total: 0
          },
          estaciones: []
        }
      });
    }

    console.log('[getDashboardGerenteEstacion] Buscando con parámetros:', {
      estacionesIds,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin
    });

    // Calcular merma, entregas y gastos por estación
    const estacionesResult = await pool.query(`
      SELECT 
        e.id as estacion_id,
        e.nombre as estacion_nombre,
        COUNT(DISTINCT r.id) as num_reportes,
        COALESCE(SUM(rp.merma_importe), 0) as merma_generada,
        COALESCE(
          (SELECT SUM(en.monto) 
           FROM entregas en 
           WHERE en.estacion_id = e.id 
           AND en.tipo_entrega = 'estacion_zona'
           AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
           AND en.fecha >= $2 
           AND en.fecha <= $3), 
          0
        ) as entregas_realizadas,
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as gastos_realizados,
        COALESCE(SUM(rp.merma_importe), 0) - 
        COALESCE(
          (SELECT SUM(en.monto) 
           FROM entregas en 
           WHERE en.estacion_id = e.id 
           AND en.tipo_entrega = 'estacion_zona'
           AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
           AND en.fecha >= $2 
           AND en.fecha <= $3), 
          0
        ) - 
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as saldo_resguardo
      FROM estaciones e
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= $2
        AND DATE(r.fecha) <= $3
        AND r.estado = 'Aprobado'
      LEFT JOIN reporte_productos rp ON rp.reporte_id = r.id
      WHERE e.id = ANY($1) AND e.activa = true
      GROUP BY e.id, e.nombre
      ORDER BY e.nombre
    `, [estacionesIds, periodo.fecha_inicio, periodo.fecha_fin]);

    console.log('[getDashboardGerenteEstacion] Estaciones encontradas:', estacionesResult.rows.length);
    if (estacionesResult.rows.length > 0) {
      console.log('[getDashboardGerenteEstacion] Primera estación:', estacionesResult.rows[0]);
    }

    const totales = {
      merma_total: estacionesResult.rows.reduce((sum, est) => sum + parseFloat(est.merma_generada), 0),
      entregas_total: estacionesResult.rows.reduce((sum, est) => sum + parseFloat(est.entregas_realizadas), 0),
      gastos_total: estacionesResult.rows.reduce((sum, est) => sum + parseFloat(est.gastos_realizados), 0),
      resguardo_total: estacionesResult.rows.reduce((sum, est) => sum + parseFloat(est.saldo_resguardo), 0)
    };

    return res.json({
      tipo: 'gerente_estacion',
      data: {
        totales,
        estaciones: estacionesResult.rows
      }
    });
  } catch (error) {
    console.error('[getDashboardGerenteEstacion] Error:', error);
    throw error;
  }
}

/**
 * Dashboard para Gerente de Zona
 */
async function getDashboardGerenteZona(usuario: any, periodo: any, res: Response) {
  try {
    // Obtener zona asignada al usuario desde la base de datos
    const usuarioResult = await pool.query(
      `SELECT zona_id FROM users WHERE id = $1`,
      [usuario.id]
    );

    if (usuarioResult.rows.length === 0 || !usuarioResult.rows[0].zona_id) {
      return res.status(403).json({ error: 'Usuario no tiene zona asignada' });
    }

    const zonaId = usuarioResult.rows[0].zona_id;
    
    console.log('[getDashboardGerenteZona] Zona ID:', zonaId);

    // Obtener información de la zona
    const zonaResult = await pool.query(
      'SELECT id, nombre FROM zonas WHERE id = $1',
      [zonaId]
    );

    if (zonaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const zona = zonaResult.rows[0];

    const periodoContableResult = await pool.query(
      `SELECT 1
       FROM liquidaciones_mensuales
       WHERE zona_id = $1
         AND estacion_id IS NULL
         AND anio = $2
         AND mes = $3
         AND estado = 'cerrado'
       LIMIT 1`,
      [zonaId, periodo.anio, periodo.mes]
    );
    const periodoContableLiquidado = periodoContableResult.rows.length > 0;

    console.log('[getDashboardGerenteZona] Buscando con parámetros:', {
      zonaId,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin
    });

    // Calcular merma, entregas y gastos por estación de la zona
    const estacionesResult = await pool.query(`
      SELECT 
        e.id as estacion_id,
        e.nombre as estacion_nombre,
        e.identificador_externo as clave,
        COUNT(DISTINCT r.id) as num_reportes,
        COALESCE(SUM(rp.merma_importe), 0) as merma_generada,
        COALESCE(
          (SELECT SUM(en.monto) 
           FROM entregas en 
           WHERE en.estacion_id = e.id 
           AND en.tipo_entrega = 'estacion_zona'
           AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
           AND en.fecha >= $2 
           AND en.fecha <= $3), 
          0
        ) as entregas_realizadas,
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as gastos_realizados,
        COALESCE(SUM(rp.merma_importe), 0) - 
        COALESCE(
          (SELECT SUM(en.monto) 
           FROM entregas en 
           WHERE en.estacion_id = e.id 
           AND en.tipo_entrega = 'estacion_zona'
           AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
           AND en.fecha >= $2 
           AND en.fecha <= $3), 
          0
        ) - 
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as saldo_resguardo
      FROM estaciones e
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= $2
        AND DATE(r.fecha) <= $3
        AND r.estado = 'Aprobado'
      LEFT JOIN reporte_productos rp ON rp.reporte_id = r.id
      WHERE e.zona_id = $1 AND e.activa = true
      GROUP BY e.id, e.nombre, e.identificador_externo
      ORDER BY e.nombre
    `, [zonaId, periodo.fecha_inicio, periodo.fecha_fin]);

    console.log('[getDashboardGerenteZona] Estaciones encontradas:', estacionesResult.rows.length);
    if (estacionesResult.rows.length > 0) {
      console.log('[getDashboardGerenteZona] Primera estación:', estacionesResult.rows[0]);
      console.log('[getDashboardGerenteZona] Total merma en todas las estaciones:', 
        estacionesResult.rows.reduce((sum, est) => sum + parseFloat(est.merma_generada), 0)
      );
    }

    // Calcular entregas recibidas (estación → zona)
    const entregasRecibidasResult = await pool.query(`
      SELECT COALESCE(SUM(e.monto), 0) as total
      FROM entregas e
      WHERE e.zona_id = $1
        AND e.tipo_entrega = 'estacion_zona'
        AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
        AND e.fecha >= $2
        AND e.fecha <= $3
    `, [zonaId, periodo.fecha_inicio, periodo.fecha_fin]);

    const entregasRecibidas = parseFloat(entregasRecibidasResult.rows[0]?.total || 0);

    // Calcular entregas a dirección (zona → dirección)
    const entregasDireccionResult = await pool.query(`
      SELECT COALESCE(SUM(e.monto), 0) as total
      FROM entregas e
      WHERE e.zona_origen_id = $1
        AND e.tipo_entrega = 'zona_direccion'
        AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
        AND e.fecha >= $2
        AND e.fecha <= $3
    `, [zonaId, periodo.fecha_inicio, periodo.fecha_fin]);

    const entregasDireccion = parseFloat(entregasDireccionResult.rows[0]?.total || 0);

    // Calcular gastos de zona
    const gastosZonaResult = await pool.query(`
      SELECT COALESCE(SUM(g.monto), 0) as total
      FROM gastos g
      WHERE g.zona_id = $1
        AND g.tipo_gasto = 'zona'
        AND g.fecha >= $2
        AND g.fecha <= $3
    `, [zonaId, periodo.fecha_inicio, periodo.fecha_fin]);

    const gastosZona = parseFloat(gastosZonaResult.rows[0]?.total || 0);

    // Arrastre de saldo: saldo final del mes anterior (liquidado) -> saldo inicial del mes actual.
    const saldoInicial = await obtenerSaldoInicialZona(zonaId, periodo.anio, periodo.mes);
    const resguardoZona = saldoInicial + entregasRecibidas - entregasDireccion - gastosZona;

    // Calcular estadísticas.
    // Regla de negocio: si el periodo contable ya está liquidado, la estación debe verse liquidada
    // aunque conserve diferencia/saldo.
    const totalEstaciones = estacionesResult.rows.length;
    const estacionesLiquidadas = periodoContableLiquidado
      ? totalEstaciones
      : estacionesResult.rows.filter(est =>
          parseFloat(est.saldo_resguardo) === 0 &&
          parseFloat(est.merma_generada) > 0 &&
          parseFloat(est.entregas_realizadas) > 0
        ).length;

    const estacionesProceso = periodoContableLiquidado
      ? 0
      : estacionesResult.rows.filter(est =>
          parseFloat(est.merma_generada) > 0 &&
          parseFloat(est.entregas_realizadas) === 0
        ).length;

    const estacionesPendientes = periodoContableLiquidado
      ? 0
      : estacionesResult.rows.filter(est =>
          parseFloat(est.saldo_resguardo) > 0 &&
          parseFloat(est.entregas_realizadas) > 0
        ).length;

    const porcentajeLiquidacion = totalEstaciones > 0 ? (estacionesLiquidadas / totalEstaciones) * 100 : 0;

    // Calcular saldo pendiente por recolectar (suma de resguardos de estaciones)
    const saldoPendienteRecolectar = estacionesResult.rows.reduce((sum, est) => sum + parseFloat(est.saldo_resguardo), 0);

    console.log('[getDashboardGerenteZona] Entregas recibidas:', entregasRecibidas);
    console.log('[getDashboardGerenteZona] Entregas a dirección:', entregasDireccion);
    console.log('[getDashboardGerenteZona] Gastos zona:', gastosZona);
    console.log('[getDashboardGerenteZona] Resguardo zona:', resguardoZona);
    console.log('[getDashboardGerenteZona] Saldo pendiente en estaciones:', saldoPendienteRecolectar);

    return res.json({
      tipo: 'gerente_zona',
      data: {
        zona_id: zonaId,
        zona_nombre: zona.nombre,
        zona: {
          zona_nombre: zona.nombre,
          saldo_inicial: saldoInicial,
          entregas_recibidas: entregasRecibidas,
          entregas_direccion: entregasDireccion,
          gastos_zona: gastosZona,
          resguardo_actual: resguardoZona,
          saldo_pendiente_estaciones: saldoPendienteRecolectar
        },
        estadisticas: {
          estaciones_liquidadas: estacionesLiquidadas,
          estaciones_proceso: estacionesProceso,
          estaciones_pendientes: estacionesPendientes,
          porcentaje_liquidacion: porcentajeLiquidacion
        },
        periodo_contable_liquidado: periodoContableLiquidado,
        estaciones: estacionesResult.rows
      }
    });
  } catch (error) {
    console.error('[getDashboardGerenteZona] Error:', error);
    throw error;
  }
}

/**
 * Dashboard para Director/Administrador
 */
async function getDashboardDirector(usuario: any, periodo: any, res: Response) {
  try {
    const zonasBase = await pool.query(
      `SELECT id as zona_id, nombre as zona_nombre
       FROM zonas
       WHERE activa = true
       ORDER BY nombre`
    );

    const zonasResult = {
      rows: await Promise.all(
        zonasBase.rows.map(async (zona: any) => {
          const saldoInicial = await obtenerSaldoInicialZona(zona.zona_id, periodo.anio, periodo.mes);

          const movimientosResult = await pool.query(
            `SELECT
               COALESCE(
                 (
                   SELECT SUM(e.monto)
                   FROM entregas e
                   WHERE e.zona_id = $1
                     AND e.tipo_entrega = 'estacion_zona'
                     AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                     AND e.fecha >= $2
                     AND e.fecha <= $3
                 ),
                 0
               ) AS entregas_recibidas,
               COALESCE(
                 (
                   SELECT SUM(e.monto)
                   FROM entregas e
                   WHERE e.zona_origen_id = $1
                     AND e.tipo_entrega = 'zona_direccion'
                     AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                     AND e.fecha >= $2
                     AND e.fecha <= $3
                 ),
                 0
               ) AS entregas_direccion,
               COALESCE(
                 (
                   SELECT SUM(g.monto)
                   FROM gastos g
                   WHERE g.zona_id = $1
                     AND g.tipo_gasto = 'zona'
                     AND g.fecha >= $2
                     AND g.fecha <= $3
                 ),
                 0
               ) AS gastos_zona`,
            [zona.zona_id, periodo.fecha_inicio, periodo.fecha_fin]
          );

          const entregasRecibidas = parseFloat(movimientosResult.rows[0]?.entregas_recibidas || '0');
          const entregasDireccion = parseFloat(movimientosResult.rows[0]?.entregas_direccion || '0');
          const gastosZona = parseFloat(movimientosResult.rows[0]?.gastos_zona || '0');
          const resguardoActual = saldoInicial + entregasRecibidas - entregasDireccion - gastosZona;

          return {
            zona_id: zona.zona_id,
            zona_nombre: zona.zona_nombre,
            saldo_inicial: saldoInicial,
            entregas_recibidas: entregasRecibidas,
            entregas_direccion: entregasDireccion,
            gastos_zona: gastosZona,
            resguardo_actual: resguardoActual,
          };
        })
      ),
    };

    console.log('[getDashboardDirector] Zonas encontradas:', zonasResult.rows.length);

    const fechaInicioDireccion = new Date(periodo.anio, periodo.mes - 1, 1);
    const fechaFinDireccion = new Date(periodo.anio, periodo.mes, 0);
    const anioAnterior = periodo.anio - (periodo.mes === 1 ? 1 : 0);
    const mesAnterior = periodo.mes === 1 ? 12 : periodo.mes - 1;
    const fechaInicioAnterior = new Date(anioAnterior, mesAnterior - 1, 1);
    const fechaFinAnterior = new Date(anioAnterior, mesAnterior, 0);

    const saldoDireccionInicialResult = await pool.query(
      `SELECT COALESCE(SUM(e.monto), 0) as total
       FROM entregas e
       WHERE e.tipo_entrega = 'zona_direccion'
         AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
         AND e.fecha >= $1
         AND e.fecha <= $2`,
      [fechaInicioAnterior, fechaFinAnterior]
    );
    const saldoDireccionInicial = parseFloat(saldoDireccionInicialResult.rows[0]?.total || '0');

    const ingresosDireccionPeriodoResult = await pool.query(
      `SELECT COALESCE(SUM(e.monto), 0) as total
       FROM entregas e
       WHERE e.tipo_entrega = 'zona_direccion'
         AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
         AND e.fecha >= $1
         AND e.fecha <= $2`,
      [fechaInicioDireccion, fechaFinDireccion]
    );
    const ingresosDireccionPeriodo = parseFloat(ingresosDireccionPeriodoResult.rows[0]?.total || '0');
    const saldoDireccionFinal = saldoDireccionInicial + ingresosDireccionPeriodo;

    const totales = {
      saldo_inicial_total: saldoDireccionInicial,
      entregas_recibidas_total: zonasResult.rows.reduce((sum, zona) => sum + Number(zona.entregas_recibidas || 0), 0),
      entregas_direccion_total: saldoDireccionFinal,
      gastos_total: zonasResult.rows.reduce((sum, zona) => sum + Number(zona.gastos_zona || 0), 0),
      resguardo_total: zonasResult.rows.reduce((sum, zona) => sum + Number(zona.resguardo_actual || 0), 0)
    };

    return res.json({
      tipo: usuario.role === 'Direccion' || usuario.role === 'DirectorOperaciones' ? 'director' : 'admin',
      data: {
        totales,
        zonas: zonasResult.rows
      }
    });
  } catch (error) {
    console.error('[getDashboardDirector] Error:', error);
    throw error;
  }
}

/**
 * Obtener alertas financieras (saldos críticos y pendientes)
 */
export const getAlertas = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // Por ahora retornar alertas vacías
    // TODO: Implementar lógica de alertas basada en umbrales
    return res.json({
      criticos: [],
      advertencia: []
    });
  } catch (error) {
    console.error('[getAlertas] Error:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
};

/**
 * Registrar un gasto de estación o zona
 */
export const registrarGasto = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { estacion_id, zona_id, fecha, monto, concepto, categoria } = req.body;
    const tipo_gasto = estacion_id ? 'estacion' : 'zona';
    const entidad_id = estacion_id || zona_id;

    // Validaciones básicas
    if (!entidad_id || !fecha || !monto || !concepto) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const montoNum = parseFloat(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' });
    }

    // Verificar acceso
    if (tipo_gasto === 'estacion' && usuario.role === 'GerenteEstacion') {
      const estacionesAsignadasResult = await pool.query(
        `SELECT estacion_id FROM user_estaciones WHERE user_id = $1 AND estacion_id = $2`,
        [usuario.id, entidad_id]
      );

      if (estacionesAsignadasResult.rows.length === 0) {
        return res.status(403).json({ error: 'No tiene permiso para registrar gastos en esta estación' });
      }
    }

    // Calcular período mensual
    const fechaObj = new Date(fecha);
    const mes = fechaObj.getMonth() + 1;
    const anio = fechaObj.getFullYear();

    // Verificar que el ejercicio fiscal existe
    const ejercicioResult = await pool.query(
      'SELECT id FROM ejercicios_fiscales WHERE anio = $1 AND estado = $2',
      [anio, 'activo']
    );

    if (ejercicioResult.rows.length === 0) {
      return res.status(400).json({ error: 'Ejercicio fiscal no encontrado o inactivo' });
    }

    // Calcular fechas del período
    const fecha_inicio = new Date(anio, mes - 1, 1);
    const fecha_fin = new Date(anio, mes, 0);

    // Nota de negocio:
    // Los movimientos financieros (gastos/entregas) se controlan por cierre contable.
    // El cierre operativo aplica para reportes de venta.

    // Verificar si hay cierre contable para la zona
    if (zona_id) {
      const cierreContableResult = await pool.query(
        `SELECT estado FROM liquidaciones_mensuales 
         WHERE zona_id = $1 AND anio = $2 AND mes = $3 AND estado = 'cerrado'`,
        [zona_id, anio, mes]
      );

      if (cierreContableResult.rows.length > 0) {
        return res.status(403).json({ 
          error: 'El período contable está liquidado y cerrado. No se pueden registrar gastos.',
          detalle: 'Debe reabrir la liquidación para modificar datos.'
        });
      }
    } else if (tipo_gasto === 'estacion' && estacion_id) {
      // Verificar cierre contable de la zona de la estación
      const cierreContableEstacionResult = await pool.query(
        `SELECT lm.estado 
         FROM liquidaciones_mensuales lm
         JOIN estaciones e ON e.zona_id = lm.zona_id
         WHERE e.id = $1 AND lm.anio = $2 AND lm.mes = $3 AND lm.estado = 'cerrado'`,
        [estacion_id, anio, mes]
      );

      if (cierreContableEstacionResult.rows.length > 0) {
        return res.status(403).json({ 
          error: 'El período contable de la zona está liquidado y cerrado. No se pueden registrar gastos.',
          detalle: 'El gerente de zona debe reabrir la liquidación para modificar datos.'
        });
      }
    }

    // Validar límite de gastos
    const limiteResult = await pool.query(`
      WITH limite AS (
        SELECT lg.limite_mensual AS limite_gastos
        FROM limites_gastos lg
        WHERE lg.entidad_id = $1
          AND lg.entidad_tipo = $4
          AND lg.activo = true
        ORDER BY lg.vigente_desde DESC NULLS LAST, lg.updated_at DESC NULLS LAST, lg.created_at DESC
        LIMIT 1
      ),
      gastos_periodo AS (
        SELECT COALESCE(SUM(g.monto), 0) AS gastos_acumulados
        FROM gastos g
        WHERE g.${tipo_gasto === 'estacion' ? 'estacion_id' : 'zona_id'} = $1
          AND g.fecha >= $2
          AND g.fecha <= $3
          AND g.tipo_gasto = $4
      )
      SELECT l.limite_gastos, gp.gastos_acumulados
      FROM limite l
      CROSS JOIN gastos_periodo gp
      WHERE l.limite_gastos IS NOT NULL
    `, [entidad_id, fecha_inicio, fecha_fin, tipo_gasto]);

    if (limiteResult.rows.length === 0) {
      return res.status(400).json({ error: 'No se encontró configuración de límite para esta entidad' });
    }

    const { limite_gastos, gastos_acumulados } = limiteResult.rows[0];
    const limiteNum = parseFloat(limite_gastos);
    const gastosAcumuladosNum = parseFloat(gastos_acumulados);

    // Disponible por límite configurado.
    const disponiblePorLimite = limiteNum - gastosAcumuladosNum;

    // Disponible por saldo/resguardo real.
    let disponiblePorResguardo = 0;
    if (tipo_gasto === 'estacion') {
      const resguardoEstacionResult = await pool.query(
        `SELECT
          COALESCE(SUM(rp.merma_importe), 0) AS merma_generada,
          COALESCE(
            (
              SELECT SUM(e.monto)
              FROM entregas e
              WHERE e.estacion_id = $1
                AND e.tipo_entrega = 'estacion_zona'
                AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                AND e.fecha >= $2
                AND e.fecha <= $3
            ),
            0
          ) AS entregas_realizadas
         FROM reportes r
         JOIN reporte_productos rp ON rp.reporte_id = r.id
         WHERE r.estacion_id = $1
           AND r.fecha >= $2
           AND r.fecha <= $3
           AND r.estado = 'Aprobado'`,
        [entidad_id, fecha_inicio, fecha_fin]
      );

      const mermaGenerada = parseFloat(resguardoEstacionResult.rows[0]?.merma_generada || '0');
      const entregasRealizadas = parseFloat(resguardoEstacionResult.rows[0]?.entregas_realizadas || '0');
      disponiblePorResguardo = mermaGenerada - entregasRealizadas - gastosAcumuladosNum;
    } else {
      const resguardoZonaResult = await pool.query(
        `SELECT
          COALESCE(
            (
              SELECT SUM(e.monto)
              FROM entregas e
              WHERE e.zona_id = $1
                AND e.tipo_entrega = 'estacion_zona'
                AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                AND e.fecha >= $2
                AND e.fecha <= $3
            ),
            0
          ) AS entregas_recibidas,
          COALESCE(
            (
              SELECT SUM(e.monto)
              FROM entregas e
              WHERE e.zona_origen_id = $1
                AND e.tipo_entrega = 'zona_direccion'
                AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                AND e.fecha >= $2
                AND e.fecha <= $3
            ),
            0
          ) AS entregas_enviadas`,
        [entidad_id, fecha_inicio, fecha_fin]
      );

      const entregasRecibidas = parseFloat(resguardoZonaResult.rows[0]?.entregas_recibidas || '0');
      const entregasEnviadas = parseFloat(resguardoZonaResult.rows[0]?.entregas_enviadas || '0');
      disponiblePorResguardo = entregasRecibidas - entregasEnviadas - gastosAcumuladosNum;
    }

    const disponibleEfectivo = Math.max(0, Math.min(disponiblePorLimite, disponiblePorResguardo));
    const montoComparable = Math.round(montoNum * 100) / 100;
    const disponibleComparable = Math.round(disponibleEfectivo * 100) / 100;

    if (montoComparable > disponibleComparable + 0.000001) {
      return res.status(400).json({
        error: `Monto excedido. Disponible real: $${disponibleComparable.toFixed(2)} (límite: $${Math.max(0, disponiblePorLimite).toFixed(2)}, resguardo: $${Math.max(0, disponiblePorResguardo).toFixed(2)}).`,
        limite: limiteNum,
        acumulado: gastosAcumuladosNum,
        disponible_por_limite: Math.max(0, disponiblePorLimite),
        disponible_por_resguardo: Math.max(0, disponiblePorResguardo),
        disponible: disponibleComparable
      });
    }

    const gastos_totales = gastosAcumuladosNum + montoNum;

    // Insertar el gasto
    const insertQuery = tipo_gasto === 'estacion'
      ? `INSERT INTO gastos (fecha, tipo_gasto, estacion_id, monto, concepto, categoria, capturado_por)
         VALUES ($1, 'estacion', $2, $3, $4, $5, $6) RETURNING *`
      : `INSERT INTO gastos (fecha, tipo_gasto, zona_id, monto, concepto, categoria, capturado_por)
         VALUES ($1, 'zona', $2, $3, $4, $5, $6) RETURNING *`;

    const result = await pool.query(insertQuery, [
      fecha,
      entidad_id,
      monto,
      concepto,
      categoria || 'General',
      usuario.id
    ]);

    const gastoRegistrado = result.rows[0];
    console.log('[registrarGasto] Gasto registrado:', gastoRegistrado.id, 'Tipo:', tipo_gasto);

    // Obtener nombre de la entidad para la auditoría
    let nombreEntidad = '';
    if (tipo_gasto === 'estacion') {
      const estacionResult = await pool.query('SELECT nombre FROM estaciones WHERE id = $1', [entidad_id]);
      nombreEntidad = estacionResult.rows[0]?.nombre || entidad_id;
    } else {
      const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [entidad_id]);
      nombreEntidad = zonaResult.rows[0]?.nombre || entidad_id;
    }

    // Registrar en auditoría
    await registrarAuditoriaGeneral({
      entidadTipo: 'GASTO',
      entidadId: gastoRegistrado.id,
      usuarioId: usuario.id,
      usuarioNombre: usuario.name || usuario.email,
      accion: 'CREAR',
      descripcion: `Gasto registrado en ${tipo_gasto === 'estacion' ? 'estación' : 'zona'} "${nombreEntidad}": $${monto.toFixed(2)} - ${concepto}`,
      datosNuevos: {
        fecha,
        tipo_gasto,
        entidad: nombreEntidad,
        monto,
        concepto,
        categoria: categoria || 'General'
      },
      metadata: {
        fecha_gasto: fecha,
        categoria: categoria || 'General'
      }
    });

    return res.status(201).json({
      message: 'Gasto registrado exitosamente',
      gasto: gastoRegistrado,
      limite_restante: limiteNum - gastos_totales
    });
  } catch (error) {
    console.error('[registrarGasto] Error:', error);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
};

/**
 * Obtener gastos de una estación o zona
 */
export const obtenerGastos = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { estacion_id, zona_id, mes, anio } = req.query;
    const entidad_id = estacion_id || zona_id;
    const tipo = estacion_id ? 'estacion' : 'zona';

    if (!entidad_id) {
      return res.status(400).json({ error: 'Se requiere estacion_id o zona_id' });
    }

    // Verificar acceso
    if (tipo === 'estacion' && usuario.role === 'GerenteEstacion') {
      const estacionesAsignadasResult = await pool.query(
        `SELECT estacion_id FROM user_estaciones WHERE user_id = $1 AND estacion_id = $2`,
        [usuario.id, entidad_id]
      );

      if (estacionesAsignadasResult.rows.length === 0) {
        return res.status(403).json({ error: 'No tiene permiso para ver gastos de esta estación' });
      }
    }

    // Construir query
    let query = tipo === 'estacion'
      ? `SELECT g.*, e.nombre as entidad_nombre, u.name as capturado_por_nombre
         FROM gastos g
         LEFT JOIN estaciones e ON g.estacion_id = e.id
         LEFT JOIN users u ON g.capturado_por = u.id
         WHERE g.estacion_id = $1 AND g.tipo_gasto = 'estacion'`
      : `SELECT g.*, z.nombre as entidad_nombre, u.name as capturado_por_nombre
         FROM gastos g
         LEFT JOIN zonas z ON g.zona_id = z.id
         LEFT JOIN users u ON g.capturado_por = u.id
         WHERE g.zona_id = $1 AND g.tipo_gasto = 'zona'`;

    const params: any[] = [entidad_id];

    if (mes && anio) {
      // Calcular fechas del período directamente
      const mesNum = parseInt(mes as string);
      const anioNum = parseInt(anio as string);
      const fecha_inicio = new Date(anioNum, mesNum - 1, 1);
      const fecha_fin = new Date(anioNum, mesNum, 0);

      query += ` AND g.fecha >= $2 AND g.fecha <= $3`;
      params.push(fecha_inicio, fecha_fin);
    }

    query += ` ORDER BY g.fecha DESC`;

    const result = await pool.query(query, params);

    return res.json({
      gastos: result.rows,
      total: result.rows.reduce((sum, g) => sum + parseFloat(g.monto), 0)
    });
  } catch (error) {
    console.error('[obtenerGastos] Error:', error);
    res.status(500).json({ error: 'Error al obtener gastos' });
  }
};

/**
 * Registrar una entrega (estación→zona o zona→dirección)
 */
export const registrarEntrega = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { tipo_entrega, estacion_id, zona_id: zonaIdBody, fecha, monto, concepto, destinatario_id } = req.body;
    const archivo = (req as any).file as Express.Multer.File | undefined;

    // Validar permisos según tipo de entrega
    if (tipo_entrega === 'estacion_zona') {
      // Nuevo flujo: la entrega la registra el gerente de estación (o admin).
      if (usuario.role !== 'GerenteEstacion' && usuario.role !== 'Administrador') {
        return res.status(403).json({ error: 'Solo gerentes de estación pueden registrar entregas de estación a zona' });
      }
    } else if (tipo_entrega === 'zona_direccion') {
      // Entregas de zona a dirección: las inicia gerente de zona (o admin).
      if (usuario.role !== 'GerenteZona' && usuario.role !== 'Administrador') {
        return res.status(403).json({ error: 'Solo gerente de zona o administrador pueden registrar entregas de zona a dirección' });
      }
    }

    // Validaciones
    if (!tipo_entrega || !fecha || !monto) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const montoNum = parseFloat(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' });
    }

    if (tipo_entrega === 'estacion_zona' && !estacion_id) {
      return res.status(400).json({ error: 'Se requiere estacion_id para entregas de estación a zona' });
    }

    if (tipo_entrega === 'zona_direccion' && !destinatario_id) {
      return res.status(400).json({ error: 'Se requiere seleccionar el usuario destino (Dirección/Director Operaciones)' });
    }

    // En el nuevo flujo, el gerente de estación debe tener permiso sobre la estación
    if (tipo_entrega === 'estacion_zona' && usuario.role === 'GerenteEstacion') {
      const estacionesAsignadasResult = await pool.query(
        `SELECT estacion_id FROM user_estaciones WHERE user_id = $1 AND estacion_id = $2`,
        [usuario.id, estacion_id]
      );

      if (estacionesAsignadasResult.rows.length === 0) {
        return res.status(403).json({ error: 'No tiene permiso para registrar entregas en esta estación' });
      }
    }

    // Resolver zona_id real desde estación para evitar inconsistencias
    let zona_id = zonaIdBody as string | undefined;
    if (tipo_entrega === 'estacion_zona') {
      const estacionZonaResult = await pool.query(
        `SELECT e.zona_id, z.nombre as zona_nombre
         FROM estaciones e
         JOIN zonas z ON z.id = e.zona_id
         WHERE e.id = $1 AND e.activa = true`,
        [estacion_id]
      );

      if (estacionZonaResult.rows.length === 0) {
        return res.status(400).json({ error: 'Estación inválida o inactiva' });
      }

      zona_id = estacionZonaResult.rows[0].zona_id;

      if (!archivo) {
        return res.status(400).json({
          error: 'Se requiere archivo de evidencia para registrar la entrega',
          detalle: 'Adjunta un archivo antes de enviar la entrega.'
        });
      }
    }

    if (tipo_entrega === 'zona_direccion' && usuario.role === 'GerenteZona') {
      const userZonaResult = await pool.query('SELECT zona_id FROM users WHERE id = $1', [usuario.id]);
      zona_id = userZonaResult.rows[0]?.zona_id;
    }

    if (!zona_id) {
      return res.status(400).json({ error: 'No se pudo determinar la zona de la entrega' });
    }

    if (tipo_entrega === 'zona_direccion') {
      const destinatarioResult = await pool.query(
        `SELECT u.id, r.codigo as role_codigo
         FROM users u
         LEFT JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1
         LIMIT 1`,
        [destinatario_id]
      );

      if (destinatarioResult.rows.length === 0) {
        return res.status(400).json({ error: 'Usuario destino no válido' });
      }

      const roleDestino = destinatarioResult.rows[0].role_codigo || null;
      if (roleDestino !== 'Direccion' && roleDestino !== 'DirectorOperaciones') {
        return res.status(400).json({ error: 'El usuario destino debe tener rol Dirección o DirectorOperaciones' });
      }
    }

    // Verificar si el período está cerrado
    const fechaObj = new Date(fecha);
    const mes = fechaObj.getMonth() + 1;
    const anio = fechaObj.getFullYear();

    // Verificar que el ejercicio fiscal existe
    const ejercicioResult = await pool.query(
      'SELECT id FROM ejercicios_fiscales WHERE anio = $1 AND estado = $2',
      [anio, 'activo']
    );

    if (ejercicioResult.rows.length === 0) {
      return res.status(400).json({ error: 'Ejercicio fiscal no encontrado o inactivo' });
    }

    // Verificar cierre contable
    const cierreContableResult = await pool.query(
      `SELECT estado FROM liquidaciones_mensuales 
       WHERE zona_id = $1 AND anio = $2 AND mes = $3 AND estado = 'cerrado'`,
      [zona_id, anio, mes]
    );

    if (tipo_entrega !== 'zona_direccion' && cierreContableResult.rows.length > 0) {
      return res.status(403).json({ 
        error: 'El período contable está liquidado y cerrado. No se pueden registrar entregas.',
        detalle: 'Debe reabrir la liquidación para modificar datos.'
      });
    }

    // VALIDACIÓN DE SALDO DISPONIBLE
    if (tipo_entrega === 'estacion_zona') {
      // Para entregas de estación a zona, verificar que la estación tenga saldo suficiente
      const saldoEstacionResult = await pool.query(
        `SELECT 
          COALESCE(SUM(rp.merma_importe), 0) as merma_generada,
          COALESCE((SELECT SUM(g.monto) FROM gastos g 
                    WHERE g.estacion_id = $1 AND g.tipo_gasto = 'estacion'
                    AND EXTRACT(MONTH FROM g.fecha) = $2 AND EXTRACT(YEAR FROM g.fecha) = $3), 0) as gastos_realizados,
          COALESCE((SELECT SUM(e.monto) FROM entregas e 
                    WHERE e.estacion_id = $1 AND e.tipo_entrega = 'estacion_zona'
                    AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                    AND EXTRACT(MONTH FROM e.fecha) = $2 AND EXTRACT(YEAR FROM e.fecha) = $3), 0) as entregas_realizadas
        FROM reporte_productos rp
        JOIN reportes r ON rp.reporte_id = r.id
        WHERE r.estacion_id = $1
          AND EXTRACT(MONTH FROM r.fecha) = $2
          AND EXTRACT(YEAR FROM r.fecha) = $3`,
        [estacion_id, mes, anio]
      );

      const { merma_generada, gastos_realizados, entregas_realizadas } = saldoEstacionResult.rows[0];
      const saldo_disponible = parseFloat(merma_generada) - parseFloat(gastos_realizados) - parseFloat(entregas_realizadas);

      // Redondear ambos valores a 2 decimales para evitar errores de precisión de punto flotante
      const montoRedondeado = Math.round(montoNum * 10000) / 10000;
      const saldoRedondeado = Math.round(saldo_disponible * 10000) / 10000;

      if (montoRedondeado > saldoRedondeado) {
        // Regla de negocio: permitir sobre-entrega cuando operación lo requiera.
        // Se registra aviso en logs para trazabilidad.
        console.warn(
          `[registrarEntrega] Sobre-entrega permitida ESTACIÓN: Disponible=$${saldo_disponible.toFixed(2)}, Entregando=$${montoNum.toFixed(2)}`
        )
      }

      console.log(`[registrarEntrega] Validación de saldo ESTACIÓN: Disponible=$${saldo_disponible.toFixed(2)}, Entregando=$${montoNum.toFixed(2)}`);
    }

    if (tipo_entrega === 'zona_direccion') {
      // Para entregas de zona a dirección, verificar que la zona tenga resguardo suficiente
      const resguardoZonaResult = await pool.query(
        `SELECT 
          COALESCE((SELECT SUM(e.monto) FROM entregas e 
                    WHERE e.zona_id = $1 AND e.tipo_entrega = 'estacion_zona'
                    AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                    AND EXTRACT(MONTH FROM e.fecha) = $2 AND EXTRACT(YEAR FROM e.fecha) = $3), 0) as entregas_recibidas,
          COALESCE((SELECT SUM(g.monto) FROM gastos g 
                    WHERE g.zona_id = $1 AND g.tipo_gasto = 'zona'
                    AND EXTRACT(MONTH FROM g.fecha) = $2 AND EXTRACT(YEAR FROM g.fecha) = $3), 0) as gastos_zona,
          COALESCE((SELECT SUM(e.monto) FROM entregas e 
                    WHERE e.zona_origen_id = $1 AND e.tipo_entrega = 'zona_direccion'
                    AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                    AND EXTRACT(MONTH FROM e.fecha) = $2 AND EXTRACT(YEAR FROM e.fecha) = $3), 0) as entregas_enviadas`,
        [zona_id, mes, anio]
      );

      const { entregas_recibidas, gastos_zona, entregas_enviadas } = resguardoZonaResult.rows[0];
      const resguardo_disponible = parseFloat(entregas_recibidas) - parseFloat(gastos_zona) - parseFloat(entregas_enviadas);

      // Redondear ambos valores a 2 decimales para evitar errores de precisión de punto flotante
      const montoRedondeado = Math.round(montoNum * 10000) / 10000;
      const resguardoRedondeado = Math.round(resguardo_disponible * 10000) / 10000;

      if (montoRedondeado > resguardoRedondeado) {
        return res.status(400).json({ 
          error: 'Resguardo insuficiente en la zona',
          detalle: `La zona solo tiene $${resguardo_disponible.toFixed(2)} disponible. No se pueden entregar $${montoNum.toFixed(2)}.`,
          resguardo_disponible: resguardo_disponible,
          entregas_recibidas: parseFloat(entregas_recibidas),
          gastos_zona: parseFloat(gastos_zona),
          entregas_enviadas: parseFloat(entregas_enviadas)
        });
      }

      console.log(`[registrarEntrega] Validación de saldo ZONA: Disponible=$${resguardo_disponible.toFixed(2)}, Entregando=$${montoNum.toFixed(2)}`);
    }

    // Insertar la entrega
    const insertQuery = tipo_entrega === 'estacion_zona'
      ? `INSERT INTO entregas (
           fecha, tipo_entrega, estacion_id, zona_id, monto, concepto, capturado_por,
           estado_entrega, archivo_nombre, archivo_ruta, archivo_mime, archivo_tamano
         )
         VALUES ($1, 'estacion_zona', $2, $3, $4, $5, $6, 'pendiente_firma', $7, $8, $9, $10)
         RETURNING *`
      : `INSERT INTO entregas (fecha, tipo_entrega, zona_origen_id, monto, concepto, capturado_por, estado_entrega, destinatario_id)
         VALUES ($1, 'zona_direccion', $2, $3, $4, $5, 'pendiente_firma', $6) RETURNING *`;

    const params = tipo_entrega === 'estacion_zona'
      ? [
          fecha,
          estacion_id,
          zona_id,
          montoNum,
          concepto || '',
          usuario.id,
          archivo?.originalname || null,
          archivo?.path || null,
          archivo?.mimetype || null,
          archivo?.size || null
        ]
      : [fecha, zona_id, montoNum, concepto || '', usuario.id, destinatario_id];

    const result = await pool.query(insertQuery, params);
    const entregaRegistrada = result.rows[0];

    console.log('[registrarEntrega] Entrega registrada:', entregaRegistrada.id, 'Tipo:', tipo_entrega);

    // Obtener nombres de las entidades para la auditoría
    let descripcionEntrega = '';
    if (tipo_entrega === 'estacion_zona') {
      const estacionResult = await pool.query('SELECT nombre FROM estaciones WHERE id = $1', [estacion_id]);
      const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [zona_id]);
      const nombreEstacion = estacionResult.rows[0]?.nombre || estacion_id;
      const nombreZona = zonaResult.rows[0]?.nombre || zona_id;
      descripcionEntrega = `Solicitud de entrega de estación "${nombreEstacion}" a zona "${nombreZona}": $${montoNum.toFixed(2)} - ${concepto || 'Sin concepto'}`;
    } else {
      const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [zona_id]);
      const nombreZona = zonaResult.rows[0]?.nombre || zona_id;
      descripcionEntrega = `Entrega de zona "${nombreZona}" a dirección: $${montoNum.toFixed(2)} - ${concepto || 'Sin concepto'}`;
    }

    // Registrar en auditoría
    await registrarAuditoriaGeneral({
      entidadTipo: 'ENTREGA',
      entidadId: entregaRegistrada.id,
      usuarioId: usuario.id,
      usuarioNombre: usuario.name || usuario.email,
      accion: 'CREAR',
      descripcion: descripcionEntrega,
      datosNuevos: {
        fecha,
        tipo_entrega,
        monto: montoNum,
        concepto: concepto || '',
        destinatario_id: tipo_entrega === 'zona_direccion' ? destinatario_id : null
      },
      metadata: {
        fecha_entrega: fecha
      }
    });

    return res.status(201).json({
      message: tipo_entrega === 'estacion_zona'
        ? 'Entrega registrada y enviada para firma del gerente de zona'
        : 'Entrega registrada y enviada para firma de dirección / director operaciones',
      entrega: entregaRegistrada
    });
  } catch (error) {
    console.error('[registrarEntrega] Error:', error);
    res.status(500).json({ error: 'Error al registrar entrega' });
  }
};

/**
 * Obtener entregas de una estación o zona
 */
export const obtenerEntregas = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { estacion_id, zona_id, mes, anio, estado } = req.query;

    if (!estacion_id && !zona_id) {
      return res.status(400).json({ error: 'Se requiere estacion_id o zona_id' });
    }

    // Construir query
    let query = `
      SELECT e.*, 
        est.nombre as estacion_nombre, 
        z.nombre as zona_nombre,
        u.name as registrado_por_nombre
      FROM entregas e
      LEFT JOIN estaciones est ON e.estacion_id = est.id
      LEFT JOIN zonas z ON e.zona_id = z.id OR e.zona_origen_id = z.id
      LEFT JOIN users u ON e.capturado_por = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (estacion_id) {
      query += ` AND e.estacion_id = $${paramIndex}`;
      params.push(estacion_id);
      paramIndex++;
    }

    if (zona_id) {
      query += ` AND (e.zona_id = $${paramIndex} OR e.zona_origen_id = $${paramIndex})`;
      params.push(zona_id);
      paramIndex++;
    }

    if (estado) {
      query += ` AND e.estado_entrega = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (mes && anio) {
      // Calcular fechas del período directamente
      const mesNum = parseInt(mes as string);
      const anioNum = parseInt(anio as string);
      const fecha_inicio = new Date(anioNum, mesNum - 1, 1);
      const fecha_fin = new Date(anioNum, mesNum, 0);

      query += ` AND e.fecha >= $${paramIndex} AND e.fecha <= $${paramIndex + 1}`;
      params.push(fecha_inicio, fecha_fin);
      paramIndex += 2;
    }

    query += ` ORDER BY e.fecha DESC`;

    const result = await pool.query(query, params);

    return res.json({
      entregas: result.rows,
      total: result.rows.reduce((sum, e) => sum + parseFloat(e.monto), 0)
    });
  } catch (error) {
    console.error('[obtenerEntregas] Error:', error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

export const obtenerEntregasPendientesFirma = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const esGerenteZona = usuario.role === 'GerenteZona';
    const puedeFirmarZona = esGerenteZona || usuario.role === 'Administrador';
    const puedeFirmarDireccion = usuario.role === 'Direccion' || usuario.role === 'DirectorOperaciones' || usuario.role === 'Administrador';

    if (!puedeFirmarZona && !puedeFirmarDireccion) {
      return res.status(403).json({ error: 'No tiene permisos para firmar entregas' });
    }

    const { mes, anio, zona_id } = req.query;
    const mesNum = parseInt((mes as string) || '', 10);
    const anioNum = parseInt((anio as string) || '', 10);

    if (esGerenteZona && (!mesNum || !anioNum)) {
      return res.status(400).json({ error: 'Se requiere mes y anio' });
    }

    let zonaId = zona_id as string | undefined;
    if (esGerenteZona) {
      const userZonaResult = await pool.query('SELECT zona_id FROM users WHERE id = $1', [usuario.id]);
      zonaId = userZonaResult.rows[0]?.zona_id;
    }

    if (esGerenteZona && !zonaId) {
      return res.status(400).json({ error: 'No se pudo determinar la zona para consultar pendientes' });
    }

    let result;
    if (esGerenteZona) {
      result = await pool.query(
        `SELECT
           e.id,
           e.fecha,
           e.tipo_entrega,
           e.monto,
           e.concepto,
           e.estado_entrega,
           e.archivo_nombre,
           e.archivo_ruta,
           est.id as estacion_id,
           est.nombre as estacion_nombre,
           z.id as zona_id,
           z.nombre as zona_nombre,
           u.name as capturado_por_nombre
         FROM entregas e
         INNER JOIN estaciones est ON est.id = e.estacion_id
         INNER JOIN zonas z ON z.id = e.zona_id
         LEFT JOIN users u ON u.id = e.capturado_por
         WHERE e.tipo_entrega = 'estacion_zona'
           AND e.estado_entrega = 'pendiente_firma'
           AND e.zona_id = $1
           AND EXTRACT(MONTH FROM e.fecha) = $2
           AND EXTRACT(YEAR FROM e.fecha) = $3
         ORDER BY e.fecha DESC, est.nombre ASC`,
        [zonaId, mesNum, anioNum]
      );
    } else if (usuario.role === 'Direccion' || usuario.role === 'DirectorOperaciones') {
      result = await pool.query(
        `SELECT
           e.id,
           e.fecha,
           e.tipo_entrega,
           e.monto,
           e.concepto,
           e.estado_entrega,
           e.destinatario_id,
           NULL::uuid as estacion_id,
           NULL::text as estacion_nombre,
           z.id as zona_id,
           z.nombre as zona_nombre,
           u.name as capturado_por_nombre,
           ud.name as destinatario_nombre
         FROM entregas e
         INNER JOIN zonas z ON z.id = e.zona_origen_id
         LEFT JOIN users u ON u.id = e.capturado_por
         LEFT JOIN users ud ON ud.id = e.destinatario_id
         WHERE e.tipo_entrega = 'zona_direccion'
           AND e.estado_entrega = 'pendiente_firma'
           AND e.destinatario_id = $1
         ORDER BY e.fecha DESC, z.nombre ASC`,
        [usuario.id]
      );
    } else {
      result = await pool.query(
        `SELECT
           e.id,
           e.fecha,
           e.tipo_entrega,
           e.monto,
           e.concepto,
           e.estado_entrega,
           e.destinatario_id,
           NULL::uuid as estacion_id,
           NULL::text as estacion_nombre,
           z.id as zona_id,
           z.nombre as zona_nombre,
           u.name as capturado_por_nombre,
           ud.name as destinatario_nombre
         FROM entregas e
         INNER JOIN zonas z ON z.id = e.zona_origen_id
         LEFT JOIN users u ON u.id = e.capturado_por
         LEFT JOIN users ud ON ud.id = e.destinatario_id
         WHERE e.estado_entrega = 'pendiente_firma'
           AND e.tipo_entrega IN ('zona_direccion', 'estacion_zona')
           ${zonaId ? 'AND (e.zona_origen_id = $1 OR e.zona_id = $1)' : ''}
         ORDER BY e.fecha DESC, z.nombre ASC`,
        zonaId ? [zonaId] : []
      );
    }

    return res.json({
      entregas: result.rows,
      total: result.rows.length,
      zona_id: zonaId || null,
    });
  } catch (error) {
    console.error('[obtenerEntregasPendientesFirma] Error:', error);
    res.status(500).json({ error: 'Error al obtener entregas pendientes de firma' });
  }
};

export const firmarEntrega = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const puedeFirmarZona = usuario.role === 'GerenteZona' || usuario.role === 'Administrador';
    const puedeFirmarDireccion = usuario.role === 'Direccion' || usuario.role === 'DirectorOperaciones' || usuario.role === 'Administrador';

    if (!puedeFirmarZona && !puedeFirmarDireccion) {
      return res.status(403).json({ error: 'No tiene permisos para firmar entregas' });
    }

    const { id } = req.params;
    const { observaciones } = req.body || {};

    const entregaResult = await pool.query(
      `SELECT e.id, e.tipo_entrega, e.zona_id, e.zona_origen_id, e.destinatario_id, e.estado_entrega, z.nombre as zona_nombre
       FROM entregas e
       LEFT JOIN zonas z ON z.id = COALESCE(e.zona_id, e.zona_origen_id)
       WHERE e.id = $1`,
      [id]
    );

    if (entregaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrega no encontrada' });
    }

    const entrega = entregaResult.rows[0];
    if (entrega.estado_entrega !== 'pendiente_firma') {
      return res.status(400).json({ error: 'La entrega ya fue firmada o no está en estado pendiente' });
    }

    if (entrega.tipo_entrega === 'estacion_zona') {
      if (!puedeFirmarZona) {
        return res.status(403).json({ error: 'Solo gerente de zona o admin pueden firmar entregas de estación a zona' });
      }

      if (usuario.role === 'GerenteZona') {
        const userZonaResult = await pool.query('SELECT zona_id FROM users WHERE id = $1', [usuario.id]);
        const zonaUsuario = userZonaResult.rows[0]?.zona_id;
        if (zonaUsuario !== entrega.zona_id) {
          return res.status(403).json({ error: 'No tiene permiso para firmar entregas de esta zona' });
        }
      }
    } else if (entrega.tipo_entrega === 'zona_direccion') {
      if (!puedeFirmarDireccion) {
        return res.status(403).json({ error: 'Solo dirección, director operaciones o admin pueden firmar entregas de zona a dirección' });
      }

      if ((usuario.role === 'Direccion' || usuario.role === 'DirectorOperaciones') && entrega.destinatario_id !== usuario.id) {
        return res.status(403).json({ error: 'Esta entrega no fue asignada a su usuario' });
      }
    } else {
      return res.status(400).json({ error: 'Tipo de entrega no soportado para firma' });
    }

    const updateResult = await pool.query(
      `UPDATE entregas
       SET estado_entrega = 'confirmada',
           firmado_por = $1,
           fecha_firma = CURRENT_TIMESTAMP,
           observaciones_firma = $2
       WHERE id = $3
       RETURNING *`,
      [usuario.id, observaciones || null, id]
    );

    await registrarAuditoriaGeneral({
      entidadTipo: 'ENTREGA',
      entidadId: id,
      usuarioId: usuario.id,
      usuarioNombre: usuario.name || usuario.email,
      accion: 'ACTUALIZAR',
      descripcion:
        entrega.tipo_entrega === 'zona_direccion'
          ? `Firma de recepción de entrega de zona "${entrega.zona_nombre || entrega.zona_origen_id}" hacia dirección`
          : `Firma de conformidad de entrega en zona "${entrega.zona_nombre || entrega.zona_id}"`,
      datosNuevos: {
        estado_entrega: 'confirmada',
        observaciones_firma: observaciones || null,
      },
    });

    return res.json({
      message:
        entrega.tipo_entrega === 'zona_direccion'
          ? 'Entrega de zona a dirección firmada'
          : 'Entrega firmada de conformidad',
      entrega: updateResult.rows[0],
    });
  } catch (error) {
    console.error('[firmarEntrega] Error:', error);
    res.status(500).json({ error: 'Error al firmar entrega' });
  }
};

export const obtenerFirmantesDireccion = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (usuario.role !== 'GerenteZona' && usuario.role !== 'Administrador') {
      return res.status(403).json({ error: 'No tiene permisos para consultar firmantes' });
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, r.codigo as role
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE r.codigo IN ('Direccion', 'DirectorOperaciones')
       ORDER BY
         CASE r.codigo WHEN 'Direccion' THEN 1 ELSE 2 END,
         u.name ASC`
    );

    return res.json({ usuarios: result.rows });
  } catch (error) {
    console.error('[obtenerFirmantesDireccion] Error:', error);
    return res.status(500).json({ error: 'Error al consultar firmantes disponibles' });
  }
};

/**
 * Cerrar período contable (liquidación mensual)
 */
export const cerrarPeriodoContable = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario || usuario.role !== 'GerenteZona') {
      return res.status(403).json({ error: 'Solo los gerentes de zona pueden cerrar períodos contables' });
    }

    const { mes, anio, observaciones } = req.body;

    if (!mes || !anio) {
      return res.status(400).json({ error: 'Se requiere mes y año' });
    }

    // Obtener zona del usuario
    const usuarioResult = await pool.query(
      `SELECT zona_id FROM users WHERE id = $1`,
      [usuario.id]
    );

    const zona_id = usuarioResult.rows[0]?.zona_id;

    if (!zona_id) {
      return res.status(400).json({ error: 'Usuario no tiene zona asignada' });
    }

    // Verificar que el período no esté ya cerrado
    const liquidacionExistente = await pool.query(
      `SELECT id, estado FROM liquidaciones_mensuales 
       WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
      [zona_id, anio, mes]
    );

    if (liquidacionExistente.rows.length > 0 && liquidacionExistente.rows[0].estado === 'cerrado') {
      return res.status(400).json({ error: 'El período ya está cerrado' });
    }

    // Verificar que el ejercicio fiscal existe
    const ejercicioResult = await pool.query(
      'SELECT id FROM ejercicios_fiscales WHERE anio = $1 AND estado = $2',
      [anio, 'activo']
    );

    if (ejercicioResult.rows.length === 0) {
      return res.status(400).json({ error: 'Ejercicio fiscal no encontrado o inactivo' });
    }

    // Calcular fechas del período
    const fecha_inicio = new Date(anio, mes - 1, 1);
    const fecha_fin = new Date(anio, mes, 0);

    // Verificar que esté cerrado operativamente
    const cierreOperativo = await pool.query(
      `SELECT esta_cerrado FROM zonas_periodos_cierre 
       WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
      [zona_id, anio, mes]
    );

    if (cierreOperativo.rows.length === 0 || !cierreOperativo.rows[0].esta_cerrado) {
      return res.status(400).json({ 
        error: 'Debe cerrar el período operativo antes de liquidar',
        detalle: 'Primero cierre la captura de reportes'
      });
    }

    // Obtener datos financieros de las estaciones
    const estacionesResult = await pool.query(`
      SELECT 
        e.id as estacion_id,
        e.nombre as estacion_nombre,
        COALESCE(SUM(rp.merma_importe), 0) as merma_generada,
        COALESCE(
          (SELECT SUM(en.monto) 
           FROM entregas en 
           WHERE en.estacion_id = e.id 
           AND en.tipo_entrega = 'estacion_zona'
           AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
           AND en.fecha >= $2 
           AND en.fecha <= $3), 
          0
        ) as entregas_realizadas,
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as gastos_realizados,
        COALESCE(SUM(rp.merma_importe), 0) - 
        COALESCE(
          (SELECT SUM(en.monto) 
           FROM entregas en 
           WHERE en.estacion_id = e.id 
           AND en.tipo_entrega = 'estacion_zona'
           AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
           AND en.fecha >= $2 
           AND en.fecha <= $3), 
          0
        ) - 
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as saldo_resguardo
      FROM estaciones e
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= $2
        AND DATE(r.fecha) <= $3
        AND r.estado = 'Aprobado'
      LEFT JOIN reporte_productos rp ON rp.reporte_id = r.id
      WHERE e.zona_id = $1 AND e.activa = true
      GROUP BY e.id, e.nombre
      ORDER BY e.nombre
    `, [zona_id, fecha_inicio, fecha_fin]);

    // Se permite liquidar aunque existan saldos en estaciones.
    // Estos saldos se guardan como diferencia por estación y total de diferencia por zona.
    const totalMermaEstaciones = estacionesResult.rows.reduce(
      (sum, est) => sum + parseFloat(est.merma_generada || '0'),
      0
    );
    const diferenciaTotalEstaciones = estacionesResult.rows.reduce(
      (sum, est) => sum + parseFloat(est.saldo_resguardo || '0'),
      0
    );

    // Calcular datos financieros de la zona
    const saldo_inicial = await obtenerSaldoInicialZona(zona_id, anio, mes);

    const entregasRecibidasResult = await pool.query(`
      SELECT COALESCE(SUM(en.monto), 0) as total
      FROM entregas en
      JOIN estaciones e ON e.id = en.estacion_id
      WHERE e.zona_id = $1
        AND en.tipo_entrega = 'estacion_zona'
        AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
        AND en.fecha >= $2
        AND en.fecha <= $3
    `, [zona_id, fecha_inicio, fecha_fin]);

    const entregas_recibidas = parseFloat(entregasRecibidasResult.rows[0]?.total || '0');

    const entregasDireccionResult = await pool.query(`
      SELECT COALESCE(SUM(en.monto), 0) as total
      FROM entregas en
      WHERE en.zona_origen_id = $1
        AND en.tipo_entrega = 'zona_direccion'
        AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
        AND en.fecha >= $2
        AND en.fecha <= $3
    `, [zona_id, fecha_inicio, fecha_fin]);

    const entregas_direccion = parseFloat(entregasDireccionResult.rows[0]?.total || '0');

    const gastosZonaResult = await pool.query(`
      SELECT COALESCE(SUM(g.monto), 0) as total
      FROM gastos g
      WHERE g.zona_id = $1
        AND g.tipo_gasto = 'zona'
        AND g.fecha >= $2
        AND g.fecha <= $3
    `, [zona_id, fecha_inicio, fecha_fin]);

    const gastos_zona = parseFloat(gastosZonaResult.rows[0]?.total || '0');

    const saldo_final = saldo_inicial + entregas_recibidas - entregas_direccion - gastos_zona;

    // Registrar liquidación
    if (liquidacionExistente.rows.length > 0) {
      // Actualizar liquidación existente
      await pool.query(`
        UPDATE liquidaciones_mensuales
        SET merma_generada = $1,
            entregas_realizadas = $2,
            gastos_realizados = $3,
            saldo_inicial = $4,
            saldo_final = $5,
            diferencia = $6,
            fecha_cierre = CURRENT_TIMESTAMP,
            cerrado_por = $7,
            estado = 'cerrado',
            observaciones = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE zona_id = $9 AND anio = $10 AND mes = $11
      `, [
        totalMermaEstaciones,
        entregas_recibidas + entregas_direccion,
        gastos_zona,
        saldo_inicial,
        saldo_final,
        diferenciaTotalEstaciones,
        usuario.id,
        observaciones || null,
        zona_id,
        anio,
        mes
      ]);
    } else {
      // Crear nueva liquidación
      await pool.query(`
        INSERT INTO liquidaciones_mensuales (
          zona_id, anio, mes, merma_generada, entregas_realizadas, 
          gastos_realizados, saldo_inicial, saldo_final, diferencia, estado, 
          fecha_cierre, cerrado_por, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'cerrado', CURRENT_TIMESTAMP, $10, $11)
      `, [
        zona_id,
        anio,
        mes,
        totalMermaEstaciones,
        entregas_recibidas + entregas_direccion,
        gastos_zona,
        saldo_inicial,
        saldo_final,
        diferenciaTotalEstaciones,
        usuario.id,
        observaciones || null
      ]);
    }

    // Registrar liquidaciones de estaciones
    for (const estacion of estacionesResult.rows) {
      const checkEstacion = await pool.query(
        `SELECT id FROM liquidaciones_mensuales 
         WHERE estacion_id = $1 AND anio = $2 AND mes = $3`,
        [estacion.estacion_id, anio, mes]
      );

      if (checkEstacion.rows.length > 0) {
        await pool.query(`
          UPDATE liquidaciones_mensuales
          SET merma_generada = $1,
              entregas_realizadas = $2,
              gastos_realizados = $3,
              saldo_final = $4,
              diferencia = $5,
              estado = 'cerrado',
              fecha_cierre = CURRENT_TIMESTAMP,
              cerrado_por = $6,
              updated_at = CURRENT_TIMESTAMP
          WHERE estacion_id = $7 AND anio = $8 AND mes = $9
        `, [
          parseFloat(estacion.merma_generada),
          parseFloat(estacion.entregas_realizadas),
          parseFloat(estacion.gastos_realizados),
          parseFloat(estacion.saldo_resguardo),
          parseFloat(estacion.saldo_resguardo),
          usuario.id,
          estacion.estacion_id,
          anio,
          mes
        ]);
      } else {
        await pool.query(`
          INSERT INTO liquidaciones_mensuales (
            estacion_id, anio, mes, merma_generada, entregas_realizadas, 
            gastos_realizados, saldo_inicial, saldo_final, diferencia, estado, 
            fecha_cierre, cerrado_por
          ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, 'cerrado', CURRENT_TIMESTAMP, $9)
        `, [
          estacion.estacion_id,
          anio,
          mes,
          parseFloat(estacion.merma_generada),
          parseFloat(estacion.entregas_realizadas),
          parseFloat(estacion.gastos_realizados),
          parseFloat(estacion.saldo_resguardo),
          parseFloat(estacion.saldo_resguardo),
          usuario.id
        ]);
      }
    }

    res.json({
      success: true,
      message: 'Período contable cerrado exitosamente',
      liquidacion: {
        zona_id,
        mes,
        anio,
        saldo_inicial,
        entregas_recibidas,
        entregas_direccion,
        gastos_zona,
        saldo_final,
        diferencia_total_estaciones: diferenciaTotalEstaciones,
        fecha_cierre: new Date()
      }
    });
  } catch (error) {
    console.error('[cerrarPeriodoContable] Error:', error);
    res.status(500).json({ error: 'Error al cerrar período contable' });
  }
};

/**
 * Reabrir período contable
 */
export const reabrirPeriodoContable = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario || usuario.role !== 'GerenteZona') {
      return res.status(403).json({ error: 'Solo los gerentes de zona pueden reabrir períodos contables' });
    }

    const { mes, anio, motivo } = req.body;

    if (!mes || !anio || !motivo) {
      return res.status(400).json({ error: 'Se requiere mes, año y motivo de reapertura' });
    }

    // Obtener zona del usuario
    const usuarioResult = await pool.query(
      `SELECT zona_id FROM users WHERE id = $1`,
      [usuario.id]
    );

    const zona_id = usuarioResult.rows[0]?.zona_id;

    if (!zona_id) {
      return res.status(400).json({ error: 'Usuario no tiene zona asignada' });
    }

    // Verificar que exista una liquidación cerrada
    const liquidacionResult = await pool.query(
      `SELECT id FROM liquidaciones_mensuales 
       WHERE zona_id = $1 AND anio = $2 AND mes = $3 AND estado = 'cerrado'`,
      [zona_id, anio, mes]
    );

    if (liquidacionResult.rows.length === 0) {
      return res.status(400).json({ error: 'No hay liquidación cerrada para reabrir' });
    }

    // Reabrir liquidación de zona
    await pool.query(`
      UPDATE liquidaciones_mensuales
      SET estado = 'reabierto',
          reabierto_en = CURRENT_TIMESTAMP,
          reabierto_por = $1,
          motivo_reapertura = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE zona_id = $3 AND anio = $4 AND mes = $5
    `, [usuario.id, motivo, zona_id, anio, mes]);

    // Reabrir liquidaciones de estaciones
    await pool.query(`
      UPDATE liquidaciones_mensuales
      SET estado = 'reabierto',
          updated_at = CURRENT_TIMESTAMP
      WHERE estacion_id IN (SELECT id FROM estaciones WHERE zona_id = $1)
        AND anio = $2 AND mes = $3
    `, [zona_id, anio, mes]);

    res.json({
      success: true,
      message: 'Período contable reabierto exitosamente'
    });
  } catch (error) {
    console.error('[reabrirPeriodoContable] Error:', error);
    res.status(500).json({ error: 'Error al reabrir período contable' });
  }
};

/**
 * Obtener resguardo de una estación en un período específico
 */
export const obtenerResguardoEstacion = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { estacion_id, mes, anio } = req.query;

    if (!estacion_id || !mes || !anio) {
      return res.status(400).json({ error: 'Se requiere estacion_id, mes y anio' });
    }

    // Calcular fechas del período directamente
    const mesNum = parseInt(mes as string);
    const anioNum = parseInt(anio as string);
    const fecha_inicio = new Date(anioNum, mesNum - 1, 1);
    const fecha_fin = new Date(anioNum, mesNum, 0);

    // Calcular merma, entregas y gastos
    const result = await pool.query(`
      SELECT 
        e.id as estacion_id,
        e.nombre as estacion_nombre,
        COALESCE(SUM(rp.merma_importe), 0) as merma_generada,
        0 as entregas_realizadas,
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as gastos_realizados,
        COALESCE(SUM(rp.merma_importe), 0) - 0 - COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           WHERE g.estacion_id = e.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $2 
           AND g.fecha <= $3), 
          0
        ) as saldo_resguardo
      FROM estaciones e
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= $2
        AND DATE(r.fecha) <= $3
        AND r.estado = 'Aprobado'
      LEFT JOIN reporte_productos rp ON rp.reporte_id = r.id
      WHERE e.id = $1 AND e.activa = true
      GROUP BY e.id, e.nombre
    `, [estacion_id, fecha_inicio, fecha_fin]);

    // Obtener entregas realizadas
    const entregasResult = await pool.query(`
      SELECT COALESCE(SUM(en.monto), 0) as total
      FROM entregas en
      WHERE en.estacion_id = $1
        AND en.tipo_entrega = 'estacion_zona'
        AND COALESCE(en.estado_entrega, 'confirmada') = 'confirmada'
        AND en.fecha >= $2
        AND en.fecha <= $3
    `, [estacion_id, fecha_inicio, fecha_fin]);

    const entregas = parseFloat(entregasResult.rows[0]?.total || 0);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Estación no encontrada' });
    }

    const estacion = result.rows[0];
    const resguardo = parseFloat(estacion.saldo_resguardo) - entregas;

    return res.json({
      estacion_id: estacion.estacion_id,
      estacion_nombre: estacion.estacion_nombre,
      merma_generada: parseFloat(estacion.merma_generada),
      entregas_realizadas: entregas,
      gastos_realizados: parseFloat(estacion.gastos_realizados),
      saldo_resguardo: resguardo,
      periodo: { mes: parseInt(mes as string), anio: parseInt(anio as string) }
    });
  } catch (error) {
    console.error('[obtenerResguardoEstacion] Error:', error);
    res.status(500).json({ error: 'Error al obtener resguardo de estación' });
  }
};

/**
 * Verificar estado del período (abierto/cerrado)
 */
export const verificarEstadoPeriodo = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { entidad_tipo, entidad_id, mes, anio } = req.query;

    if (!entidad_tipo || !entidad_id || !mes || !anio) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    const mesNum = parseInt(mes as string);
    const anioNum = parseInt(anio as string);

    // Verificar que el ejercicio fiscal existe
    const ejercicioResult = await pool.query(
      'SELECT id FROM ejercicios_fiscales WHERE anio = $1 AND estado = $2',
      [anioNum, 'activo']
    );

    if (ejercicioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ejercicio fiscal no encontrado' });
    }

    let cierre_operativo = false;
    let cierre_contable = false;
    let zona_id = null;

    // Obtener zona_id según el tipo de entidad
    if (entidad_tipo === 'estacion') {
      const estacionResult = await pool.query(
        'SELECT zona_id FROM estaciones WHERE id = $1',
        [entidad_id]
      );
      zona_id = estacionResult.rows[0]?.zona_id;
    } else {
      zona_id = entidad_id;
    }

    if (!zona_id) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    // Verificar cierre operativo
    const cierreOperativoResult = await pool.query(
      `SELECT esta_cerrado, fecha_cierre, observaciones
       FROM zonas_periodos_cierre
       WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
      [zona_id, anioNum, mesNum]
    );

    if (cierreOperativoResult.rows.length > 0) {
      cierre_operativo = cierreOperativoResult.rows[0].esta_cerrado;
    }

    // Verificar cierre contable
    const cierreContableResult = await pool.query(
      `SELECT estado, fecha_cierre
       FROM liquidaciones_mensuales
       WHERE zona_id = $1 AND anio = $2 AND mes = $3`,
      [zona_id, anioNum, mesNum]
    );

    if (cierreContableResult.rows.length > 0) {
      cierre_contable = cierreContableResult.rows[0].estado === 'cerrado';
    }

    // Regla de negocio:
    // - Cierre operativo: bloquea captura/edición de reportes operativos.
    // - Cierre contable: bloquea movimientos financieros (gastos/entregas/liquidación).
    const financiero_abierto = !cierre_contable;

    return res.json({
      periodo_abierto: financiero_abierto,
      cierre_operativo,
      cierre_contable,
      puede_registrar_gastos: financiero_abierto,
      puede_registrar_entregas: financiero_abierto,
      mensaje: cierre_contable
        ? 'Período contable cerrado: movimientos financieros bloqueados'
        : cierre_operativo
        ? 'Período operativo cerrado: reportes operativos bloqueados, finanzas permitidas'
        : 'Período abierto para registros financieros'
    });
  } catch (error) {
    console.error('[verificarEstadoPeriodo] Error:', error);
    res.status(500).json({ error: 'Error al verificar estado del período' });
  }
};

/**
 * Obtener límite disponible para gastos
 */
export const obtenerLimiteDisponible = async (req: AuthRequest, res: Response) => {
  try {
    const usuario = req.user;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { entidad_tipo, entidad_id, mes, anio } = req.query;

    if (!entidad_tipo || !entidad_id) {
      return res.status(400).json({ error: 'Se requiere entidad_tipo y entidad_id' });
    }

    // Obtener período mensual (usar actual si no se especifica)
    const mesNum = mes ? parseInt(mes as string) : new Date().getMonth() + 1;
    const anioNum = anio ? parseInt(anio as string) : new Date().getFullYear();

    // Calcular fechas del período directamente
    const fecha_inicio = new Date(anioNum, mesNum - 1, 1);
    const fecha_fin = new Date(anioNum, mesNum, 0);

    // Obtener límite y gastos acumulados
    const campo_id = entidad_tipo === 'estacion' ? 'estacion_id' : 'zona_id';
    
    const result = await pool.query(`
      WITH limite AS (
        SELECT lg.limite_mensual AS limite_gastos
        FROM limites_gastos lg
        WHERE lg.entidad_id = $1
          AND lg.entidad_tipo = $4
          AND lg.activo = true
        ORDER BY lg.vigente_desde DESC NULLS LAST, lg.updated_at DESC NULLS LAST, lg.created_at DESC
        LIMIT 1
      ),
      gastos_periodo AS (
        SELECT COALESCE(SUM(g.monto), 0) AS gastos_acumulados
        FROM gastos g
        WHERE g.${campo_id} = $1
          AND g.fecha >= $2
          AND g.fecha <= $3
          AND g.tipo_gasto = $4
      )
      SELECT
        l.limite_gastos,
        gp.gastos_acumulados,
        l.limite_gastos - gp.gastos_acumulados AS disponible
      FROM limite l
      CROSS JOIN gastos_periodo gp
      WHERE l.limite_gastos IS NOT NULL
    `, [entidad_id, fecha_inicio, fecha_fin, entidad_tipo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró configuración de límite' });
    }

    const limiteGastos = parseFloat(result.rows[0].limite_gastos);
    const gastosAcumulados = parseFloat(result.rows[0].gastos_acumulados);
    const disponiblePorLimite = parseFloat(result.rows[0].disponible);

    // Calcular disponible real por resguardo.
    let disponiblePorResguardo = 0;
    if (entidad_tipo === 'estacion') {
      const resguardoEstacionResult = await pool.query(
        `SELECT
          COALESCE(SUM(rp.merma_importe), 0) AS merma_generada,
          COALESCE(
            (
              SELECT SUM(e.monto)
              FROM entregas e
              WHERE e.estacion_id = $1
                AND e.tipo_entrega = 'estacion_zona'
                AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                AND e.fecha >= $2
                AND e.fecha <= $3
            ),
            0
          ) AS entregas_realizadas
         FROM reportes r
         JOIN reporte_productos rp ON rp.reporte_id = r.id
         WHERE r.estacion_id = $1
           AND r.fecha >= $2
           AND r.fecha <= $3
           AND r.estado = 'Aprobado'`,
        [entidad_id, fecha_inicio, fecha_fin]
      );

      const mermaGenerada = parseFloat(resguardoEstacionResult.rows[0]?.merma_generada || '0');
      const entregasRealizadas = parseFloat(resguardoEstacionResult.rows[0]?.entregas_realizadas || '0');
      disponiblePorResguardo = mermaGenerada - entregasRealizadas - gastosAcumulados;
    } else {
      const resguardoZonaResult = await pool.query(
        `SELECT
          COALESCE(
            (
              SELECT SUM(e.monto)
              FROM entregas e
              WHERE e.zona_id = $1
                AND e.tipo_entrega = 'estacion_zona'
                AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                AND e.fecha >= $2
                AND e.fecha <= $3
            ),
            0
          ) AS entregas_recibidas,
          COALESCE(
            (
              SELECT SUM(e.monto)
              FROM entregas e
              WHERE e.zona_origen_id = $1
                AND e.tipo_entrega = 'zona_direccion'
                AND COALESCE(e.estado_entrega, 'confirmada') = 'confirmada'
                AND e.fecha >= $2
                AND e.fecha <= $3
            ),
            0
          ) AS entregas_enviadas`,
        [entidad_id, fecha_inicio, fecha_fin]
      );

      const entregasRecibidas = parseFloat(resguardoZonaResult.rows[0]?.entregas_recibidas || '0');
      const entregasEnviadas = parseFloat(resguardoZonaResult.rows[0]?.entregas_enviadas || '0');
      disponiblePorResguardo = entregasRecibidas - entregasEnviadas - gastosAcumulados;
    }

    const disponibleEfectivo = Math.max(0, Math.min(disponiblePorLimite, disponiblePorResguardo));

    return res.json({
      limite_gastos: limiteGastos,
      gastos_acumulados: gastosAcumulados,
      disponible_por_limite: Math.max(0, disponiblePorLimite),
      disponible_por_resguardo: Math.max(0, disponiblePorResguardo),
      disponible: disponibleEfectivo,
      periodo: { mes: mesNum, anio: anioNum }
    });
  } catch (error) {
    console.error('[obtenerLimiteDisponible] Error:', error);
    res.status(500).json({ error: 'Error al obtener límite disponible' });
  }
};
