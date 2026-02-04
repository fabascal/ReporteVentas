import { pool } from '../config/database.js'

interface AuditoriaParams {
  entidadTipo: 'GASTO' | 'ENTREGA' | 'CIERRE_PERIODO' | 'REAPERTURA_PERIODO' | 'USUARIO' | 'ESTACION' | 'ZONA'
  entidadId?: string
  usuarioId: string
  usuarioNombre: string
  accion: 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR' | 'CERRAR' | 'REABRIR'
  descripcion: string
  datosAnteriores?: any
  datosNuevos?: any
  metadata?: any
}

/**
 * Registra un evento de auditoría en el sistema
 */
export async function registrarAuditoriaGeneral({
  entidadTipo,
  entidadId,
  usuarioId,
  usuarioNombre,
  accion,
  descripcion,
  datosAnteriores,
  datosNuevos,
  metadata
}: AuditoriaParams): Promise<void> {
  try {
    await pool.query(
      `
      INSERT INTO sistema_auditoria (
        entidad_tipo, entidad_id, usuario_id, usuario_nombre, accion,
        descripcion, datos_anteriores, datos_nuevos, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        entidadTipo,
        entidadId || null,
        usuarioId,
        usuarioNombre,
        accion,
        descripcion,
        datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datosNuevos ? JSON.stringify(datosNuevos) : null,
        metadata ? JSON.stringify(metadata) : null
      ]
    )
  } catch (error) {
    console.error('Error al registrar auditoría general:', error)
    // No lanzamos el error para no interrumpir el flujo principal
  }
}

/**
 * Obtener logs de auditoría del sistema
 */
export async function obtenerLogsAuditoria(
  page: number = 1,
  limit: number = 20,
  filtros?: {
    entidadTipo?: string
    usuarioId?: string
    accion?: string
    fechaDesde?: string
    fechaHasta?: string
    busqueda?: string
  }
) {
  try {
    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramCount = 1

    // Aplicar filtros
    if (filtros?.entidadTipo) {
      whereClause += ` AND entidad_tipo = $${paramCount}`
      params.push(filtros.entidadTipo)
      paramCount++
    }

    if (filtros?.usuarioId) {
      whereClause += ` AND usuario_id = $${paramCount}`
      params.push(filtros.usuarioId)
      paramCount++
    }

    if (filtros?.accion) {
      whereClause += ` AND accion = $${paramCount}`
      params.push(filtros.accion)
      paramCount++
    }

    if (filtros?.fechaDesde) {
      whereClause += ` AND fecha_cambio >= $${paramCount}`
      params.push(filtros.fechaDesde)
      paramCount++
    }

    if (filtros?.fechaHasta) {
      whereClause += ` AND fecha_cambio <= $${paramCount}`
      params.push(filtros.fechaHasta + ' 23:59:59')
      paramCount++
    }

    if (filtros?.busqueda) {
      whereClause += ` AND (
        usuario_nombre ILIKE $${paramCount} OR
        descripcion ILIKE $${paramCount} OR
        entidad_tipo ILIKE $${paramCount}
      )`
      params.push(`%${filtros.busqueda}%`)
      paramCount++
    }

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sistema_auditoria
      ${whereClause}
    `

    // Query para obtener datos
    const offset = (page - 1) * limit
    const dataQuery = `
      SELECT *
      FROM sistema_auditoria
      ${whereClause}
      ORDER BY fecha_cambio DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `

    params.push(limit, offset)

    // Ejecutar queries
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)),
      pool.query(dataQuery, params),
    ])

    const total = parseInt(countResult.rows[0].total)
    const totalPages = Math.ceil(total / limit)

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error)
    throw error
  }
}
