import { Request, Response } from 'express';
import { pool } from '../config/database.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
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

    // Obtener el período
    const periodoResult = await pool.query(
      'SELECT * FROM periodos_mensuales WHERE anio = $1 AND mes = $2',
      [anio, mes]
    );

    if (periodoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Período no encontrado' });
    }

    const periodo = periodoResult.rows[0];

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
        return res.status(403).json({ error: 'Rol no autorizado' });
    }
  } catch (error) {
    console.error('[getDashboardFinanciero] Error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard financiero' });
  }
};

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
        0 as entregas_realizadas,  -- TODO: Implementar entregas
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
      entregas_total: 0,
      gastos_total: 0,
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
        0 as entregas_realizadas,  -- TODO: Implementar entregas
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
        AND e.tipo_entrega = 'estacion_a_zona'
        AND e.fecha >= $2
        AND e.fecha <= $3
    `, [zonaId, periodo.fecha_inicio, periodo.fecha_fin]);

    const entregasRecibidas = parseFloat(entregasRecibidasResult.rows[0]?.total || 0);

    // Calcular entregas a dirección (zona → dirección)
    const entregasDireccionResult = await pool.query(`
      SELECT COALESCE(SUM(e.monto), 0) as total
      FROM entregas e
      WHERE e.zona_origen_id = $1
        AND e.tipo_entrega = 'zona_a_direccion'
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

    // Calcular resguardo de zona: Saldo anterior + Entregas recibidas - Entregas dirección - Gastos zona
    const saldoInicial = 0; // TODO: Implementar saldo del mes anterior
    const resguardoZona = saldoInicial + entregasRecibidas - entregasDireccion - gastosZona;

    // Calcular estadísticas
    // Una estación está liquidada solo si: tiene merma > 0, entregas > 0, y saldo = 0
    const estacionesLiquidadas = estacionesResult.rows.filter(est => 
      parseFloat(est.saldo_resguardo) === 0 && 
      parseFloat(est.merma_generada) > 0 && 
      parseFloat(est.entregas_realizadas) > 0
    ).length;
    
    // Estaciones en proceso: tienen merma pero no han entregado nada
    const estacionesProceso = estacionesResult.rows.filter(est => 
      parseFloat(est.merma_generada) > 0 && 
      parseFloat(est.entregas_realizadas) === 0
    ).length;
    
    // Estaciones pendientes: han entregado pero aún tienen saldo
    const estacionesPendientes = estacionesResult.rows.filter(est => 
      parseFloat(est.saldo_resguardo) > 0 && 
      parseFloat(est.entregas_realizadas) > 0
    ).length;
    
    const totalEstaciones = estacionesResult.rows.length;
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
    // Obtener resumen por zona
    const zonasResult = await pool.query(`
      SELECT 
        z.id as zona_id,
        z.nombre as zona_nombre,
        0 as saldo_inicial,  -- TODO: Implementar saldo inicial
        0 as entregas_recibidas,  -- TODO: Implementar entregas recibidas
        0 as entregas_direccion,  -- TODO: Implementar entregas a dirección
        COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           JOIN estaciones e2 ON g.estacion_id = e2.id
           WHERE e2.zona_id = z.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $1 
           AND g.fecha <= $2), 
          0
        ) as gastos_zona,
        COALESCE(SUM(rp.merma_importe), 0) - COALESCE(
          (SELECT SUM(g.monto) 
           FROM gastos g 
           JOIN estaciones e2 ON g.estacion_id = e2.id
           WHERE e2.zona_id = z.id 
           AND g.tipo_gasto = 'estacion'
           AND g.fecha >= $1 
           AND g.fecha <= $2), 
          0
        ) as resguardo_actual
      FROM zonas z
      LEFT JOIN estaciones e ON e.zona_id = z.id AND e.activa = true
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= $1
        AND DATE(r.fecha) <= $2
        AND r.estado = 'Aprobado'
      LEFT JOIN reporte_productos rp ON rp.reporte_id = r.id
      WHERE z.activa = true
      GROUP BY z.id, z.nombre
      ORDER BY z.nombre
    `, [periodo.fecha_inicio, periodo.fecha_fin]);

    console.log('[getDashboardDirector] Zonas encontradas:', zonasResult.rows.length);

    const totales = {
      saldo_inicial_total: 0,
      entregas_recibidas_total: 0,
      entregas_direccion_total: 0,
      gastos_total: 0,
      resguardo_total: zonasResult.rows.reduce((sum, zona) => sum + parseFloat(zona.resguardo_actual), 0)
    };

    return res.json({
      tipo: usuario.role === 'Direccion' ? 'director' : 'admin',
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

    if (monto <= 0) {
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

    // Obtener período mensual
    const fechaObj = new Date(fecha);
    const mes = fechaObj.getMonth() + 1;
    const anio = fechaObj.getFullYear();

    const periodoResult = await pool.query(
      'SELECT id, fecha_inicio, fecha_fin FROM periodos_mensuales WHERE mes = $1 AND anio = $2',
      [mes, anio]
    );

    if (periodoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Período mensual no encontrado' });
    }

    const { id: periodo_id, fecha_inicio, fecha_fin } = periodoResult.rows[0];

    // Verificar si el período está cerrado (cierre operativo)
    if (tipo_gasto === 'estacion' && estacion_id) {
      const cierreOperativoResult = await pool.query(
        `SELECT zpc.esta_cerrado 
         FROM zonas_periodos_cierre zpc
         JOIN estaciones e ON e.zona_id = zpc.zona_id
         WHERE e.id = $1 AND zpc.periodo_id = $2 AND zpc.esta_cerrado = true`,
        [estacion_id, periodo_id]
      );

      if (cierreOperativoResult.rows.length > 0) {
        return res.status(403).json({ 
          error: 'El período operativo está cerrado. No se pueden registrar gastos.',
          detalle: 'El gerente de zona ya cerró el mes operativo para esta estación.'
        });
      }
    }

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
      SELECT 
        cl.limite_gastos,
        COALESCE(SUM(g.monto), 0) as gastos_acumulados
      FROM configuracion_limites cl
      LEFT JOIN gastos g ON g.${tipo_gasto === 'estacion' ? 'estacion_id' : 'zona_id'} = cl.entidad_id
        AND g.fecha >= $2
        AND g.fecha <= $3
      WHERE cl.entidad_id = $1 AND cl.entidad_tipo = $4 AND cl.activo = true
      GROUP BY cl.limite_gastos
    `, [entidad_id, fecha_inicio, fecha_fin, tipo_gasto]);

    if (limiteResult.rows.length === 0) {
      return res.status(400).json({ error: 'No se encontró configuración de límite para esta entidad' });
    }

    const { limite_gastos, gastos_acumulados } = limiteResult.rows[0];
    const gastos_totales = parseFloat(gastos_acumulados) + parseFloat(monto);

    if (gastos_totales > parseFloat(limite_gastos)) {
      const disponible = parseFloat(limite_gastos) - parseFloat(gastos_acumulados);
      return res.status(400).json({ 
        error: `Límite de gastos excedido. Disponible: $${disponible.toFixed(2)} de $${parseFloat(limite_gastos).toFixed(2)}`,
        limite: parseFloat(limite_gastos),
        acumulado: parseFloat(gastos_acumulados),
        disponible: disponible
      });
    }

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

    console.log('[registrarGasto] Gasto registrado:', result.rows[0].id, 'Tipo:', tipo_gasto);

    return res.status(201).json({
      message: 'Gasto registrado exitosamente',
      gasto: result.rows[0],
      limite_restante: parseFloat(limite_gastos) - gastos_totales
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
      const periodo = await pool.query(
        'SELECT fecha_inicio, fecha_fin FROM periodos_mensuales WHERE anio = $1 AND mes = $2',
        [parseInt(anio as string), parseInt(mes as string)]
      );

      if (periodo.rows.length > 0) {
        query += ` AND g.fecha >= $2 AND g.fecha <= $3`;
        params.push(periodo.rows[0].fecha_inicio, periodo.rows[0].fecha_fin);
      }
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

    // Solo gerentes de zona pueden registrar entregas
    if (usuario.role !== 'GerenteZona' && usuario.role !== 'Administrador') {
      return res.status(403).json({ error: 'Solo gerentes de zona pueden registrar entregas' });
    }

    const { tipo_entrega, estacion_id, zona_id, fecha, monto, concepto } = req.body;

    // Validaciones
    if (!tipo_entrega || !zona_id || !fecha || !monto) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (monto <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' });
    }

    if (tipo_entrega === 'estacion_a_zona' && !estacion_id) {
      return res.status(400).json({ error: 'Se requiere estacion_id para entregas de estación a zona' });
    }

    // Verificar que el gerente de zona tenga acceso a la zona
    if (usuario.role === 'GerenteZona') {
      const usuarioResult = await pool.query(
        `SELECT zona_id FROM users WHERE id = $1`,
        [usuario.id]
      );

      const zonaUsuario = usuarioResult.rows[0]?.zona_id;
      
      if (zonaUsuario !== zona_id) {
        return res.status(403).json({ error: 'No tiene permiso para registrar entregas en esta zona' });
      }
    }

    // Verificar si el período está cerrado
    const fechaObj = new Date(fecha);
    const mes = fechaObj.getMonth() + 1;
    const anio = fechaObj.getFullYear();

    const periodoResult = await pool.query(
      'SELECT id FROM periodos_mensuales WHERE mes = $1 AND anio = $2',
      [mes, anio]
    );

    if (periodoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Período mensual no encontrado' });
    }

    const periodo_id = periodoResult.rows[0].id;

    // Verificar cierre operativo
    const cierreOperativoResult = await pool.query(
      `SELECT esta_cerrado FROM zonas_periodos_cierre 
       WHERE zona_id = $1 AND periodo_id = $2 AND esta_cerrado = true`,
      [zona_id, periodo_id]
    );

    if (cierreOperativoResult.rows.length > 0) {
      return res.status(403).json({ 
        error: 'El período operativo está cerrado. No se pueden registrar entregas.',
        detalle: 'El mes ya fue cerrado operativamente.'
      });
    }

    // Verificar cierre contable
    const cierreContableResult = await pool.query(
      `SELECT estado FROM liquidaciones_mensuales 
       WHERE zona_id = $1 AND anio = $2 AND mes = $3 AND estado = 'cerrado'`,
      [zona_id, anio, mes]
    );

    if (cierreContableResult.rows.length > 0) {
      return res.status(403).json({ 
        error: 'El período contable está liquidado y cerrado. No se pueden registrar entregas.',
        detalle: 'Debe reabrir la liquidación para modificar datos.'
      });
    }

    // Insertar la entrega
    const insertQuery = tipo_entrega === 'estacion_a_zona'
      ? `INSERT INTO entregas (fecha, tipo_entrega, estacion_id, zona_id, monto, concepto, registrado_por)
         VALUES ($1, 'estacion_a_zona', $2, $3, $4, $5, $6) RETURNING *`
      : `INSERT INTO entregas (fecha, tipo_entrega, zona_origen_id, monto, concepto, registrado_por)
         VALUES ($1, 'zona_a_direccion', $2, $3, $4, $5) RETURNING *`;

    const params = tipo_entrega === 'estacion_a_zona'
      ? [fecha, estacion_id, zona_id, monto, concepto || '', usuario.id]
      : [fecha, zona_id, monto, concepto || '', usuario.id];

    const result = await pool.query(insertQuery, params);

    console.log('[registrarEntrega] Entrega registrada:', result.rows[0].id, 'Tipo:', tipo_entrega);

    return res.status(201).json({
      message: 'Entrega registrada exitosamente',
      entrega: result.rows[0]
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

    const { estacion_id, zona_id, mes, anio } = req.query;

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
      LEFT JOIN users u ON e.registrado_por = u.id
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

    if (mes && anio) {
      const periodo = await pool.query(
        'SELECT fecha_inicio, fecha_fin FROM periodos_mensuales WHERE anio = $1 AND mes = $2',
        [parseInt(anio as string), parseInt(mes as string)]
      );

      if (periodo.rows.length > 0) {
        query += ` AND e.fecha >= $${paramIndex} AND e.fecha <= $${paramIndex + 1}`;
        params.push(periodo.rows[0].fecha_inicio, periodo.rows[0].fecha_fin);
        paramIndex += 2;
      }
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

    // Obtener período mensual
    const periodoResult = await pool.query(
      'SELECT id, fecha_inicio, fecha_fin FROM periodos_mensuales WHERE mes = $1 AND anio = $2',
      [mes, anio]
    );

    if (periodoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Período mensual no encontrado' });
    }

    const { id: periodo_id, fecha_inicio, fecha_fin } = periodoResult.rows[0];

    // Verificar que esté cerrado operativamente
    const cierreOperativo = await pool.query(
      `SELECT esta_cerrado FROM zonas_periodos_cierre 
       WHERE zona_id = $1 AND periodo_id = $2`,
      [zona_id, periodo_id]
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
           AND en.tipo_entrega = 'estacion_a_zona'
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
           AND en.tipo_entrega = 'estacion_a_zona'
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

    // Validar que todas las estaciones con actividad estén en $0
    const estacionesPendientes = estacionesResult.rows.filter(est => {
      const saldo = parseFloat(est.saldo_resguardo);
      const merma = parseFloat(est.merma_generada);
      return merma > 0 && saldo !== 0;
    });

    if (estacionesPendientes.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede cerrar el período. Hay estaciones con saldo pendiente.',
        estaciones_pendientes: estacionesPendientes.map(e => ({
          nombre: e.estacion_nombre,
          saldo: parseFloat(e.saldo_resguardo)
        }))
      });
    }

    // Calcular datos financieros de la zona
    const saldoInicialResult = await pool.query(
      `SELECT saldo_final FROM liquidaciones_mensuales 
       WHERE zona_id = $1 AND anio = $2 AND mes = $3 AND estado = 'cerrado'
       ORDER BY fecha_cierre DESC LIMIT 1`,
      [zona_id, anio - (mes === 1 ? 1 : 0), mes === 1 ? 12 : mes - 1]
    );

    const saldo_inicial = parseFloat(saldoInicialResult.rows[0]?.saldo_final || '0');

    const entregasRecibidasResult = await pool.query(`
      SELECT COALESCE(SUM(en.monto), 0) as total
      FROM entregas en
      JOIN estaciones e ON e.id = en.estacion_id
      WHERE e.zona_id = $1
        AND en.tipo_entrega = 'estacion_a_zona'
        AND en.fecha >= $2
        AND en.fecha <= $3
    `, [zona_id, fecha_inicio, fecha_fin]);

    const entregas_recibidas = parseFloat(entregasRecibidasResult.rows[0]?.total || '0');

    const entregasDireccionResult = await pool.query(`
      SELECT COALESCE(SUM(en.monto), 0) as total
      FROM entregas en
      WHERE en.zona_id = $1
        AND en.tipo_entrega = 'zona_a_direccion'
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
        SET saldo_inicial = $1,
            entregas_realizadas = $2,
            gastos_realizados = $3,
            saldo_final = $4,
            fecha_cierre = CURRENT_TIMESTAMP,
            cerrado_por = $5,
            estado = 'cerrado',
            observaciones = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE zona_id = $7 AND anio = $8 AND mes = $9
      `, [saldo_inicial, entregas_recibidas + entregas_direccion, gastos_zona, saldo_final, usuario.id, observaciones || null, zona_id, anio, mes]);
    } else {
      // Crear nueva liquidación
      await pool.query(`
        INSERT INTO liquidaciones_mensuales (
          zona_id, anio, mes, merma_generada, entregas_realizadas, 
          gastos_realizados, saldo_inicial, saldo_final, estado, 
          fecha_cierre, cerrado_por, observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'cerrado', CURRENT_TIMESTAMP, $9, $10)
      `, [zona_id, anio, mes, entregas_recibidas, entregas_recibidas + entregas_direccion, gastos_zona, saldo_inicial, saldo_final, usuario.id, observaciones || null]);
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
              estado = 'cerrado',
              fecha_cierre = CURRENT_TIMESTAMP,
              cerrado_por = $5,
              updated_at = CURRENT_TIMESTAMP
          WHERE estacion_id = $6 AND anio = $7 AND mes = $8
        `, [
          parseFloat(estacion.merma_generada),
          parseFloat(estacion.entregas_realizadas),
          parseFloat(estacion.gastos_realizados),
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
            gastos_realizados, saldo_inicial, saldo_final, estado, 
            fecha_cierre, cerrado_por
          ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 'cerrado', CURRENT_TIMESTAMP, $8)
        `, [
          estacion.estacion_id,
          anio,
          mes,
          parseFloat(estacion.merma_generada),
          parseFloat(estacion.entregas_realizadas),
          parseFloat(estacion.gastos_realizados),
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

    // Obtener período mensual
    const periodoResult = await pool.query(
      'SELECT fecha_inicio, fecha_fin FROM periodos_mensuales WHERE mes = $1 AND anio = $2',
      [parseInt(mes as string), parseInt(anio as string)]
    );

    if (periodoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Período mensual no encontrado' });
    }

    const { fecha_inicio, fecha_fin } = periodoResult.rows[0];

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
        AND en.tipo_entrega = 'estacion_a_zona'
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

    const periodoResult = await pool.query(
      'SELECT fecha_inicio, fecha_fin FROM periodos_mensuales WHERE mes = $1 AND anio = $2',
      [mesNum, anioNum]
    );

    if (periodoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Período mensual no encontrado' });
    }

    const { fecha_inicio, fecha_fin } = periodoResult.rows[0];

    // Obtener límite y gastos acumulados
    const campo_id = entidad_tipo === 'estacion' ? 'estacion_id' : 'zona_id';
    
    const result = await pool.query(`
      SELECT 
        cl.limite_gastos,
        COALESCE(SUM(g.monto), 0) as gastos_acumulados,
        cl.limite_gastos - COALESCE(SUM(g.monto), 0) as disponible
      FROM configuracion_limites cl
      LEFT JOIN gastos g ON g.${campo_id} = cl.entidad_id
        AND g.fecha >= $2
        AND g.fecha <= $3
      WHERE cl.entidad_id = $1 AND cl.entidad_tipo = $4 AND cl.activo = true
      GROUP BY cl.limite_gastos
    `, [entidad_id, fecha_inicio, fecha_fin, entidad_tipo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró configuración de límite' });
    }

    return res.json({
      limite_gastos: parseFloat(result.rows[0].limite_gastos),
      gastos_acumulados: parseFloat(result.rows[0].gastos_acumulados),
      disponible: parseFloat(result.rows[0].disponible),
      periodo: { mes: mesNum, anio: anioNum }
    });
  } catch (error) {
    console.error('[obtenerLimiteDisponible] Error:', error);
    res.status(500).json({ error: 'Error al obtener límite disponible' });
  }
};
