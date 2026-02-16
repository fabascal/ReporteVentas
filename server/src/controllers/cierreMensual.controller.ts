import { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { registrarAuditoriaGeneral } from '../utils/auditoria.js';

/**
 * Validar si una zona puede cerrar un período
 */
export const validarCierrePeriodo = async (req: Request, res: Response) => {
  const { zonaId, anio, mes } = req.params;
  const usuario = (req as any).user;
  const usuarioRole = usuario?.role;
  
  // Si es GerenteZona, solo puede validar su propia zona
  let zonaIdFinal = zonaId;
  if (usuarioRole === 'GerenteZona') {
    if (!usuario.zona_id) {
      return res.status(403).json({ error: 'Usuario no tiene zona asignada' });
    }
    zonaIdFinal = usuario.zona_id;
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM validar_cierre_periodo($1, $2, $3)',
      [zonaIdFinal, parseInt(anio), parseInt(mes)]
    );
    
    const validacion = result.rows[0];
    
    // Obtener detalles de estaciones incompletas
    const detallesResult = await pool.query(`
      WITH dias_mes AS (
        SELECT 
          make_date($2::integer, $3::integer, 1) as fecha_inicio,
          (make_date($2::integer, $3::integer, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE as fecha_fin,
          EXTRACT(DAY FROM (make_date($2::integer, $3::integer, 1) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER as total_dias
      )
      SELECT 
        e.id,
        e.nombre,
        e.identificador_externo as clave,
        COUNT(DISTINCT DATE(r.fecha))::INTEGER as dias_reportados,
        dm.total_dias::INTEGER,
        COUNT(DISTINCT CASE WHEN r.estado = 'Aprobado' THEN DATE(r.fecha) END)::INTEGER as dias_aprobados
      FROM estaciones e
      CROSS JOIN dias_mes dm
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= dm.fecha_inicio 
        AND DATE(r.fecha) <= dm.fecha_fin
      WHERE e.zona_id = $1 AND e.activa = true
      GROUP BY e.id, e.nombre, e.identificador_externo, dm.total_dias
      ORDER BY e.nombre
    `, [zonaIdFinal, parseInt(anio), parseInt(mes)]);
    
    // Convertir a enteros para asegurar comparación correcta en frontend
    const estacionesConTipos = detallesResult.rows.map(est => ({
      ...est,
      dias_reportados: parseInt(est.dias_reportados),
      total_dias: parseInt(est.total_dias),
      dias_aprobados: parseInt(est.dias_aprobados)
    }));
    
    res.json({
      ...validacion,
      estaciones: estacionesConTipos
    });
  } catch (error) {
    console.error('Error al validar cierre:', error);
    res.status(500).json({ error: 'Error al validar cierre del período' });
  }
};

/**
 * Obtener control financiero de una zona para un período
 */
export const obtenerControlFinanciero = async (req: Request, res: Response) => {
  const { zonaId, anio, mes } = req.params;
  const usuario = (req as any).user;
  const usuarioRole = usuario?.role;
  
  // Si es GerenteZona, solo puede ver su propia zona
  let zonaIdFinal = zonaId;
  if (usuarioRole === 'GerenteZona') {
    if (!usuario.zona_id) {
      return res.status(403).json({ error: 'Usuario no tiene zona asignada' });
    }
    zonaIdFinal = usuario.zona_id;
  }
  
  try {
    console.log('[obtenerControlFinanciero] Params:', { zonaId, zonaIdFinal, anio, mes, usuarioRole });
    console.log('[obtenerControlFinanciero] Usuario:', { id: usuario?.id, email: usuario?.email, zona_id: usuario?.zona_id });
    
    // Calcular fechas del período directamente
    const anioInt = parseInt(anio);
    const mesInt = parseInt(mes);
    
    // Calcular saldos por estación
    // Saldo = Merma (utilidades) - Entregas - Gastos
    const saldosResult = await pool.query(`
      WITH periodo AS (
        SELECT 
          make_date($2::integer, $3::integer, 1) as fecha_inicio,
          (make_date($2::integer, $3::integer, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE as fecha_fin,
          EXTRACT(DAY FROM (make_date($2::integer, $3::integer, 1) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER as total_dias
      )
      SELECT 
        e.id as estacion_id,
        e.nombre as estacion_nombre,
        e.identificador_externo as clave,
        COALESCE(SUM(rp.merma_importe), 0) as merma_total,
        0 as entregas_total,  -- TODO: Implementar entregas
        0 as gastos_total,    -- TODO: Implementar gastos
        COALESCE(SUM(rp.merma_importe), 0) as saldo,
        COUNT(DISTINCT DATE(r.fecha)) as dias_reportados,
        COUNT(DISTINCT CASE WHEN r.estado = 'Aprobado' THEN DATE(r.fecha) END) as dias_aprobados,
        periodo.total_dias
      FROM estaciones e
      CROSS JOIN periodo
      LEFT JOIN reportes r ON r.estacion_id = e.id 
        AND DATE(r.fecha) >= periodo.fecha_inicio 
        AND DATE(r.fecha) <= periodo.fecha_fin
        AND r.estado = 'Aprobado'
      LEFT JOIN reporte_productos rp ON rp.reporte_id = r.id
      WHERE e.zona_id = $1 AND e.activa = true
      GROUP BY e.id, e.nombre, e.identificador_externo, periodo.total_dias
      ORDER BY e.nombre
    `, [zonaIdFinal, anioInt, mesInt]);
    
    console.log('[obtenerControlFinanciero] Estaciones encontradas:', saldosResult.rows.length);
    console.log('[obtenerControlFinanciero] Primera estación:', saldosResult.rows[0]);
    
    // Calcular totales de la zona
    const saldoInicial = 0; // TODO: Implementar saldo inicial de períodos anteriores
    const entregasRecibidas = 0; // TODO: Implementar entregas recibidas
    const entregasDireccion = 0; // TODO: Implementar entregas a dirección
    const gastosZona = 0; // TODO: Implementar gastos de zona
    
    const mermaTotalZona = saldosResult.rows.reduce((sum, est) => sum + parseFloat(est.merma_total), 0);
    console.log('[obtenerControlFinanciero] Merma total zona:', mermaTotalZona);
    const resguardoActual = saldoInicial + mermaTotalZona + entregasRecibidas - entregasDireccion - gastosZona;
    
    // Contar estaciones liquidadas (saldo = 0) vs pendientes (saldo > 0)
    const estacionesLiquidadas = saldosResult.rows.filter(est => parseFloat(est.saldo) === 0).length;
    const estacionesPendientes = saldosResult.rows.filter(est => parseFloat(est.saldo) > 0).length;
    const totalEstaciones = saldosResult.rows.length;
    const porcentajeLiquidacion = totalEstaciones > 0 ? (estacionesLiquidadas / totalEstaciones) * 100 : 0;
    
    // Formatear estaciones con estado
    const estaciones = saldosResult.rows.map(est => ({
      estacion_id: est.estacion_id,
      estacion_nombre: est.estacion_nombre,
      clave: est.clave,
      merma: parseFloat(est.merma_total),
      entregas: parseFloat(est.entregas_total),
      gastos: parseFloat(est.gastos_total),
      saldo: parseFloat(est.saldo),
      estado: parseFloat(est.saldo) === 0 ? 'Liquidado' : 'Pendiente',
      dias_reportados: parseInt(est.dias_reportados),
      dias_aprobados: parseInt(est.dias_aprobados),
      total_dias: parseInt(est.total_dias)
    }));
    
    res.json({
      zona_id: zonaIdFinal,
      anio: anioInt,
      mes: mesInt,
      resumen: {
        saldo_inicial: saldoInicial,
        entregas_recibidas: entregasRecibidas,
        entregas_direccion: entregasDireccion,
        gastos_zona: gastosZona,
        merma_total: mermaTotalZona,
        resguardo_actual: resguardoActual,
        estaciones_liquidadas: estacionesLiquidadas,
        estaciones_pendientes: estacionesPendientes,
        total_estaciones: totalEstaciones,
        porcentaje_liquidacion: porcentajeLiquidacion
      },
      estaciones
    });
  } catch (error) {
    console.error('Error al obtener control financiero:', error);
    res.status(500).json({ error: 'Error al obtener control financiero' });
  }
};

/**
 * Obtener estado de cierre de un período
 */
export const obtenerEstadoCierre = async (req: Request, res: Response) => {
  const { zonaId, anio, mes } = req.params;
  const usuario = (req as any).user;
  const usuarioRole = usuario?.role;
  
  // Si es GerenteZona, solo puede ver su propia zona
  let zonaIdFinal = zonaId;
  if (usuarioRole === 'GerenteZona') {
    if (!usuario.zona_id) {
      return res.status(403).json({ error: 'Usuario no tiene zona asignada' });
    }
    zonaIdFinal = usuario.zona_id;
  }
  
  try {
    const anioInt = parseInt(anio);
    const mesInt = parseInt(mes);
    
    // Obtener el cierre si existe
    const cierreResult = await pool.query(`
      SELECT 
        zpc.*,
        u.name as cerrado_por_nombre,
        ur.name as reabierto_por_nombre
      FROM zonas_periodos_cierre zpc
      LEFT JOIN users u ON zpc.cerrado_por = u.id
      LEFT JOIN users ur ON zpc.reabierto_por = ur.id
      WHERE zpc.zona_id = $1 AND zpc.anio = $2 AND zpc.mes = $3
    `, [zonaIdFinal, anioInt, mesInt]);
    
    res.json({
      anio: anioInt,
      mes: mesInt,
      cierre: cierreResult.rows[0] || null,
      esta_cerrado: cierreResult.rows[0]?.esta_cerrado || false
    });
  } catch (error) {
    console.error('Error al obtener estado de cierre:', error);
    res.status(500).json({ error: 'Error al obtener estado del cierre' });
  }
};

/**
 * Cerrar un período mensual
 */
export const cerrarPeriodo = async (req: Request, res: Response) => {
  const { zonaId, anio, mes, observaciones } = req.body;
  const usuario = (req as any).user;
  const usuarioId = usuario?.id;
  const usuarioRole = usuario?.role;
  
  if (!usuarioId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  // Si es GerenteZona, solo puede cerrar su propia zona
  let zonaIdFinal = zonaId;
  if (usuarioRole === 'GerenteZona') {
    if (!usuario.zona_id) {
      return res.status(403).json({ error: 'Usuario no tiene zona asignada' });
    }
    zonaIdFinal = usuario.zona_id;
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const anioInt = parseInt(anio);
    const mesInt = parseInt(mes);
    
    // 1. Validar que se puede cerrar
    const validacion = await client.query(
      'SELECT * FROM validar_cierre_periodo($1, $2, $3)',
      [zonaIdFinal, anioInt, mesInt]
    );
    
    if (!validacion.rows[0]?.puede_cerrar) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'No se puede cerrar el período',
        detalles: validacion.rows[0]
      });
    }
    
    // 2. Verificar si ya está cerrado
    const cierreExistente = await client.query(
      'SELECT * FROM zonas_periodos_cierre WHERE zona_id = $1 AND anio = $2 AND mes = $3',
      [zonaIdFinal, anioInt, mesInt]
    );
    
    if (cierreExistente.rows.length > 0 && cierreExistente.rows[0].esta_cerrado) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El período ya está cerrado' });
    }
    
    // Calcular fecha del período
    const fechaInicio = `${anioInt}-${String(mesInt).padStart(2, '0')}-01`;
    
    // 3. Limpiar datos agregados anteriores (si existen)
    await client.query(`
      DELETE FROM reportes_mensuales
      WHERE zona_id = $1 AND anio = $2 AND mes = $3
    `, [zonaIdFinal, anioInt, mesInt]);
    
    // 4. Obtener estaciones de la zona
    const estacionesResult = await client.query(
      'SELECT id FROM estaciones WHERE zona_id = $1 AND activa = true',
      [zonaIdFinal]
    );
    
    // 5. Calcular y guardar agregados para cada estación
    for (const estacion of estacionesResult.rows) {
      const agregados = await client.query(
        'SELECT * FROM calcular_agregados_mensuales($1, $2, $3)',
        [estacion.id, anioInt, mesInt]
      );
      
      if (agregados.rows.length > 0) {
        const agg = agregados.rows[0];
        
        // Insertar en reportes_mensuales (sin periodo_id)
        await client.query(`
          INSERT INTO reportes_mensuales (
            zona_id, estacion_id, anio, mes, fecha,
            premium_volumen_total, premium_importe_total, premium_precio_promedio,
            premium_merma_volumen_total, premium_merma_importe_total, premium_merma_porcentaje_promedio,
            premium_eficiencia_real_total, premium_eficiencia_importe_total, premium_eficiencia_real_porcentaje_promedio,
            magna_volumen_total, magna_importe_total, magna_precio_promedio,
            magna_merma_volumen_total, magna_merma_importe_total, magna_merma_porcentaje_promedio,
            magna_eficiencia_real_total, magna_eficiencia_importe_total, magna_eficiencia_real_porcentaje_promedio,
            diesel_volumen_total, diesel_importe_total, diesel_precio_promedio,
            diesel_merma_volumen_total, diesel_merma_importe_total, diesel_merma_porcentaje_promedio,
            diesel_eficiencia_real_total, diesel_eficiencia_importe_total, diesel_eficiencia_real_porcentaje_promedio,
            aceites_total, total_ventas, dias_reportados
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21, $22, $23,
            $24, $25, $26, $27, $28, $29, $30, $31, $32,
            $33, $34, $35
          )
        `, [
          zonaIdFinal, estacion.id, anioInt, mesInt, fechaInicio,
          agg.premium_vol, agg.premium_imp, agg.premium_precio,
          agg.premium_merma_vol, agg.premium_merma_imp, agg.premium_merma_pct,
          agg.premium_efic_real, agg.premium_efic_imp, agg.premium_efic_pct,
          agg.magna_vol, agg.magna_imp, agg.magna_precio,
          agg.magna_merma_vol, agg.magna_merma_imp, agg.magna_merma_pct,
          agg.magna_efic_real, agg.magna_efic_imp, agg.magna_efic_pct,
          agg.diesel_vol, agg.diesel_imp, agg.diesel_precio,
          agg.diesel_merma_vol, agg.diesel_merma_imp, agg.diesel_merma_pct,
          agg.diesel_efic_real, agg.diesel_efic_imp, agg.diesel_efic_pct,
          agg.aceites, agg.total_vtas, agg.dias
        ]);
      }
    }
    
    // 6. Registrar el cierre
    const cierreResult = await client.query(`
      INSERT INTO zonas_periodos_cierre (
        zona_id, anio, mes, cerrado_por, observaciones, esta_cerrado
      ) VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (zona_id, anio, mes) 
      DO UPDATE SET 
        fecha_cierre = CURRENT_TIMESTAMP,
        cerrado_por = $4,
        observaciones = $5,
        esta_cerrado = true,
        reabierto_en = NULL,
        reabierto_por = NULL
      RETURNING *
    `, [zonaIdFinal, anioInt, mesInt, usuarioId, observaciones || null]);
    
    await client.query('COMMIT');

    // Obtener nombre de la zona para la auditoría
    const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [zonaIdFinal]);
    const nombreZona = zonaResult.rows[0]?.nombre || zonaIdFinal;

    // Registrar en auditoría
    await registrarAuditoriaGeneral({
      entidadTipo: 'CIERRE_PERIODO',
      entidadId: zonaIdFinal, // Usar zona_id (UUID) en lugar de cierre.id (INTEGER)
      usuarioId: usuarioId,
      usuarioNombre: usuario?.name || usuario?.email || 'Usuario',
      accion: 'CERRAR',
      descripcion: `Cierre de período ${mesInt}/${anioInt} para zona "${nombreZona}". ${estacionesResult.rows.length} estación(es) procesada(s)`,
      datosNuevos: {
        zona: nombreZona,
        periodo: `${mesInt}/${anioInt}`,
        estaciones_procesadas: estacionesResult.rows.length,
        observaciones: observaciones || null,
        cierre_id: cierreResult.rows[0].id
      },
      metadata: {
        mes: mesInt,
        anio: anioInt,
        zona_id: zonaIdFinal,
        cierre_id: cierreResult.rows[0].id
      }
    });
    
    res.json({
      success: true,
      mensaje: 'Período cerrado exitosamente',
      cierre: cierreResult.rows[0],
      estaciones_procesadas: estacionesResult.rows.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al cerrar período:', error);
    res.status(500).json({ error: 'Error al cerrar el período' });
  } finally {
    client.release();
  }
};

/**
 * Reabrir un período cerrado (solo admin)
 */
export const reabrirPeriodo = async (req: Request, res: Response) => {
  const { zonaId, anio, mes } = req.body;
  const usuario = (req as any).user;
  const usuarioId = usuario?.id;
  const usuarioRole = usuario?.role;
  
  if (!usuarioId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (usuarioRole !== 'Administrador') {
    return res.status(403).json({ error: 'Solo administradores pueden reabrir períodos' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const anioInt = parseInt(anio);
    const mesInt = parseInt(mes);
    
    // Actualizar el cierre
    const result = await client.query(`
      UPDATE zonas_periodos_cierre
      SET esta_cerrado = false,
          reabierto_en = CURRENT_TIMESTAMP,
          reabierto_por = $4
      WHERE zona_id = $1 AND anio = $2 AND mes = $3
      RETURNING *
    `, [zonaId, anioInt, mesInt, usuarioId]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cierre no encontrado' });
    }
    
    // Eliminar los agregados mensuales (para recalcular cuando se cierre de nuevo)
    await client.query(`
      DELETE FROM reportes_mensuales
      WHERE zona_id = $1 AND anio = $2 AND mes = $3
    `, [zonaId, anioInt, mesInt]);
    
    await client.query('COMMIT');

    // Obtener nombre de la zona para la auditoría
    const zonaResult = await pool.query('SELECT nombre FROM zonas WHERE id = $1', [zonaId]);
    const nombreZona = zonaResult.rows[0]?.nombre || zonaId;

    // Registrar en auditoría
    await registrarAuditoriaGeneral({
      entidadTipo: 'REAPERTURA_PERIODO',
      entidadId: zonaId, // Usar zona_id (UUID) en lugar de cierre.id (INTEGER)
      usuarioId: usuarioId,
      usuarioNombre: usuario?.name || usuario?.email || 'Usuario',
      accion: 'REABRIR',
      descripcion: `Reapertura de período ${mesInt}/${anioInt} para zona "${nombreZona}"`,
      datosNuevos: {
        zona: nombreZona,
        periodo: `${mesInt}/${anioInt}`,
        cierre_id: result.rows[0].id
      },
      metadata: {
        mes: mesInt,
        anio: anioInt,
        zona_id: zonaId,
        cierre_id: result.rows[0].id
      }
    });
    
    res.json({
      success: true,
      mensaje: 'Período reabierto exitosamente',
      cierre: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al reabrir período:', error);
    res.status(500).json({ error: 'Error al reabrir el período' });
  } finally {
    client.release();
  }
};

/**
 * Obtener resumen mensual de una zona
 */
export const obtenerResumenMensual = async (req: Request, res: Response) => {
  const { zonaId, anio, mes } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        rm.*,
        e.nombre as estacion_nombre,
        e.identificador_externo as estacion_clave
      FROM reportes_mensuales rm
      INNER JOIN estaciones e ON rm.estacion_id = e.id
      WHERE rm.zona_id = $1 
        AND rm.anio = $2 
        AND rm.mes = $3
      ORDER BY e.nombre
    `, [zonaId, parseInt(anio), parseInt(mes)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener resumen mensual:', error);
    res.status(500).json({ error: 'Error al obtener resumen mensual' });
  }
};

/**
 * Listar períodos disponibles (últimos 24 meses desde ejercicios fiscales activos)
 */
export const listarPeriodos = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        anio, 
        mes,
        CASE mes
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
        END || ' ' || anio as nombre,
        make_date(anio, mes, 1) as fecha_inicio,
        (make_date(anio, mes, 1) + INTERVAL '1 month' - INTERVAL '1 day')::DATE as fecha_fin
      FROM ejercicios_fiscales,
      LATERAL generate_series(1, 12) AS mes
      WHERE estado = 'activo'
      ORDER BY anio DESC, mes DESC
      LIMIT 24
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar períodos:', error);
    res.status(500).json({ error: 'Error al listar períodos' });
  }
};

/**
 * Listar cierres de una zona
 */
export const listarCierresZona = async (req: Request, res: Response) => {
  const { zonaId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        zpc.*,
        CASE zpc.mes
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
        END || ' ' || zpc.anio as periodo_nombre,
        u.name as cerrado_por_nombre,
        ur.name as reabierto_por_nombre
      FROM zonas_periodos_cierre zpc
      LEFT JOIN users u ON zpc.cerrado_por = u.id
      LEFT JOIN users ur ON zpc.reabierto_por = ur.id
      WHERE zpc.zona_id = $1
      ORDER BY zpc.anio DESC, zpc.mes DESC
    `, [zonaId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al listar cierres:', error);
    res.status(500).json({ error: 'Error al listar cierres' });
  }
};
