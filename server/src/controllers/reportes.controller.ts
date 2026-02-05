import { Response } from 'express'
import { pool } from '../config/database.js'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { EstadoReporte } from '../types/reportes.js'
import { Role } from '../types/auth.js'
import { obtenerLogsAuditoria } from '../utils/auditoria.js'

// Función helper para registrar auditoría
async function registrarAuditoria(
  reporteId: string,
  usuarioId: string,
  usuarioNombre: string,
  accion: 'CREAR' | 'ACTUALIZAR' | 'APROBAR' | 'RECHAZAR' | 'CAMBIO_ESTADO',
  campoModificado?: string,
  valorAnterior?: string,
  valorNuevo?: string,
  descripcion?: string,
  fechaReporte?: string
) {
  try {
    // Si no se proporciona fechaReporte, intentar obtenerla del reporte
    let fechaReporteParaGuardar = fechaReporte
    if (!fechaReporteParaGuardar) {
      try {
        const reporteResult = await pool.query(
          'SELECT fecha FROM reportes WHERE id = $1',
          [reporteId]
        )
        if (reporteResult.rows.length > 0) {
          const fecha = reporteResult.rows[0].fecha
          // Formatear la fecha como YYYY-MM-DD
          if (fecha instanceof Date) {
            fechaReporteParaGuardar = fecha.toISOString().split('T')[0]
          } else if (typeof fecha === 'string') {
            fechaReporteParaGuardar = fecha.split('T')[0]
          }
        }
      } catch (e) {
        console.warn('No se pudo obtener fecha del reporte para auditoría:', e)
      }
    }

    // Formatear valores si son fechas
    const formatearValor = (valor: any): string | null => {
      if (!valor) return null
      if (typeof valor === 'string') {
        // Si es una fecha en formato ISO, extraer solo la fecha
        if (valor.match(/^\d{4}-\d{2}-\d{2}T/)) {
          return valor.split('T')[0]
        }
        // Si es un objeto Date serializado (contiene "GMT"), limpiar
        if (valor.includes('GMT')) {
          try {
            const date = new Date(valor)
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0]
            }
          } catch (e) {
            // Si no se puede parsear, devolver el valor original
          }
        }
      }
      return String(valor)
    }

    const valorAnteriorFormateado = formatearValor(valorAnterior)
    const valorNuevoFormateado = formatearValor(valorNuevo)

    await pool.query(
      `
      INSERT INTO reportes_auditoria (
        reporte_id, usuario_id, usuario_nombre, accion, 
        campo_modificado, valor_anterior, valor_nuevo, descripcion, fecha_reporte
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        reporteId,
        usuarioId,
        usuarioNombre,
        accion,
        campoModificado || null,
        valorAnteriorFormateado,
        valorNuevoFormateado,
        descripcion || null,
        fechaReporteParaGuardar || null
      ]
    )
  } catch (error) {
    console.error('Error al registrar auditoría:', error)
    // No lanzamos el error para no interrumpir el flujo principal
  }
}

// Función helper para obtener productos de un reporte desde reporte_productos
async function obtenerProductosReporte(reporteId: string) {
  const result = await pool.query(
    `
    SELECT 
      rp.*,
      pc.nombre_api,
      pc.nombre_display,
      pc.tipo_producto
    FROM reporte_productos rp
    JOIN productos_catalogo pc ON rp.producto_id = pc.id
    WHERE rp.reporte_id = $1
    ORDER BY pc.tipo_producto, pc.nombre_display
    `,
    [reporteId]
  )

  // Convertir a formato de objeto por tipo_producto (para compatibilidad con código existente)
  const productos: any = {}
  result.rows.forEach((row) => {
    const tipo = row.tipo_producto.toLowerCase()
    productos[tipo] = {
      precio: parseFloat(row.precio || '0'),
      litros: parseFloat(row.litros || '0'),
      importe: parseFloat(row.importe || '0'),
      mermaVolumen: parseFloat(row.merma_volumen || '0'),
      mermaImporte: parseFloat(row.merma_importe || '0'),
      mermaPorcentaje: parseFloat(row.merma_porcentaje || '0'),
      iib: parseFloat(row.iib || '0'),
      compras: parseFloat(row.compras || '0'),
      cct: parseFloat(row.cct || '0'),
      vDsc: parseFloat(row.v_dsc || '0'),
      dc: parseFloat(row.dc || '0'),
      difVDsc: parseFloat(row.dif_v_dsc || '0'),
      if: parseFloat(row.if || '0'),
      iffb: parseFloat(row.iffb || '0'),
    }
  })

  // Asegurar que existan premium, magna, diesel (para compatibilidad)
  if (!productos.premium) productos.premium = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }
  if (!productos.magna) productos.magna = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }
  if (!productos.diesel) productos.diesel = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }

  return productos
}

// Función helper para guardar/actualizar productos de un reporte
async function guardarProductosReporte(
  reporteId: string,
  productos: { [key: string]: any },
  esActualizacion: boolean = false
) {
  // Obtener IDs de productos del catálogo
  const productosCatalogo = await pool.query(
    `SELECT id, tipo_producto FROM productos_catalogo WHERE activo = true`
  )

  const productosMap = new Map<string, string>()
  productosCatalogo.rows.forEach((row) => {
    productosMap.set(row.tipo_producto.toLowerCase(), row.id)
  })

  // Si es actualización, eliminar productos existentes
  if (esActualizacion) {
    await pool.query(`DELETE FROM reporte_productos WHERE reporte_id = $1`, [reporteId])
  }

  // Insertar productos
  for (const [tipoProducto, datos] of Object.entries(productos)) {
    const productoId = productosMap.get(tipoProducto.toLowerCase())
    if (!productoId) {
      console.warn(`Producto ${tipoProducto} no encontrado en catálogo, saltando...`)
      continue
    }

    // Validar y convertir valores a números
    // Calcular valores derivados
    const litros = parseFloat((datos.litros || 0).toString()) || 0
    const mermaVolumen = parseFloat((datos.mermaVolumen || 0).toString()) || 0
    const precio = parseFloat((datos.precio || 0).toString()) || 0
    const iib = parseFloat((datos.iib || 0).toString()) || 0
    const compras = parseFloat((datos.compras || 0).toString()) || 0
    const cct = parseFloat((datos.cct || 0).toString()) || 0
    const iffb = parseFloat((datos.iffb || 0).toString()) || 0
    
    // IF = (IIB + CCT) - LTS
    const iif = (iib + cct) - litros
    
    // ER = IFFB - IF
    const eficienciaReal = iffb - iif
    
    // ER$ = ER * Precio
    const eficienciaImporte = eficienciaReal * precio
    
    // V = LTS - Merma Vol
    const v = litros - mermaVolumen
    
    // ER% = ER / (V + Merma Vol) pero limitado para evitar overflow
    let eficienciaRealPorcentaje = 0
    if ((v + mermaVolumen) !== 0) {
      const porcentaje = (eficienciaReal / (v + mermaVolumen)) * 100
      // Limitar a rango válido para numeric(8,4): -9999.9999 a 9999.9999
      eficienciaRealPorcentaje = Math.max(-9999.9999, Math.min(9999.9999, porcentaje))
    }
    
    // E% = (E / V) * 100, donde E = mermaVolumen
    let mermaPorcentaje = 0
    if (v !== 0) {
      const porcentaje = (mermaVolumen / v) * 100
      // Limitar a rango válido para numeric(8,4): -9999.9999 a 9999.9999
      mermaPorcentaje = Math.max(-9999.9999, Math.min(9999.9999, porcentaje))
    }

    const valores = [
      reporteId,
      productoId,
      precio,
      litros,
      parseFloat((datos.importe || 0).toString()) || 0,
      mermaVolumen,
      parseFloat((datos.mermaImporte || 0).toString()) || 0,
      mermaPorcentaje,
      parseFloat((datos.iib || 0).toString()) || 0,
      parseFloat((datos.compras || 0).toString()) || 0,
      parseFloat((datos.cct || 0).toString()) || 0,
      parseFloat((datos.vDsc || 0).toString()) || 0,
      parseFloat((datos.dc || 0).toString()) || 0,
      parseFloat((datos.difVDsc || 0).toString()) || 0,
      iif,
      iffb,
      eficienciaReal,
      eficienciaImporte,
      eficienciaRealPorcentaje,
    ]

    await pool.query(
      `
      INSERT INTO reporte_productos (
        reporte_id, producto_id, precio, litros, importe,
        merma_volumen, merma_importe, merma_porcentaje,
        iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb,
        eficiencia_real, eficiencia_importe, eficiencia_real_porcentaje, fecha
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, (SELECT fecha FROM reportes WHERE id = $1))
      ON CONFLICT (reporte_id, producto_id, fecha) DO UPDATE SET
        precio = EXCLUDED.precio,
        litros = EXCLUDED.litros,
        importe = EXCLUDED.importe,
        merma_volumen = EXCLUDED.merma_volumen,
        merma_importe = EXCLUDED.merma_importe,
        merma_porcentaje = EXCLUDED.merma_porcentaje,
        iib = EXCLUDED.iib,
        compras = EXCLUDED.compras,
        cct = EXCLUDED.cct,
        v_dsc = EXCLUDED.v_dsc,
        dc = EXCLUDED.dc,
        dif_v_dsc = EXCLUDED.dif_v_dsc,
        if = EXCLUDED.if,
        iffb = EXCLUDED.iffb,
        eficiencia_real = EXCLUDED.eficiencia_real,
        eficiencia_importe = EXCLUDED.eficiencia_importe,
        eficiencia_real_porcentaje = EXCLUDED.eficiencia_real_porcentaje,
        updated_at = CURRENT_TIMESTAMP
      `,
      valores
    )
  }
}

export const reportesController = {
  async getReportes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Parámetros de paginación
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const offset = (page - 1) * limit
      
      // Filtro opcional por estado (para historial, revision, etc.)
      const estadoFiltro = req.query.estado as string | undefined
      
      // Filtros adicionales
      const estacionIdFiltro = req.query.estacionId as string | undefined
      const fechaDesdeFiltro = req.query.fechaDesde as string | undefined
      const fechaHastaFiltro = req.query.fechaHasta as string | undefined

      // Query para contar total de reportes
      let countQuery = `
        SELECT COUNT(*) as total
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        JOIN zonas z ON e.zona_id = z.id
        WHERE 1=1
      `

      let query = `
        SELECT 
          r.*,
          e.nombre as estacion_nombre,
          z.nombre as zona_nombre,
          u1.name as creado_por_nombre,
          u2.name as revisado_por_nombre
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        JOIN zonas z ON e.zona_id = z.id
        LEFT JOIN users u1 ON r.creado_por = u1.id
        LEFT JOIN users u2 ON r.revisado_por = u2.id
        WHERE 1=1
      `

      const params: any[] = []
      let paramCount = 1

      // Filtrar según el rol y estado
      if (req.user.role === 'GerenteEstacion') {
        // Reportes en estado Pendiente, EnRevision, Aprobado o Rechazado de sus estaciones asignadas
        // (EnRevision son los que el gerente aprobó, Aprobado y Rechazado son los ya procesados por GerenteZona)
        let estadosPermitidos = [EstadoReporte.Pendiente, EstadoReporte.Pendiente, EstadoReporte.Aprobado, EstadoReporte.Rechazado]
        
        // Si hay filtro de estado, aplicarlo
        if (estadoFiltro) {
          if (estadoFiltro === 'Aprobado,Rechazado') {
            // Para historial: solo Aprobado y Rechazado
            estadosPermitidos = [EstadoReporte.Aprobado, EstadoReporte.Rechazado]
          } else if (estadoFiltro === 'Pendiente,EnRevision') {
            // Para reportes activos: Pendiente y EnRevision
            estadosPermitidos = [EstadoReporte.Pendiente, EstadoReporte.Pendiente]
          } else {
            estadosPermitidos = [estadoFiltro as EstadoReporte]
          }
        }
        
        const filterClause = ` AND r.estado = ANY($${paramCount}::text[]) AND r.estacion_id IN (
          SELECT estacion_id FROM user_estaciones WHERE user_id = $${paramCount + 1}
        )`
        query += filterClause
        countQuery += filterClause
        params.push(estadosPermitidos, req.user.id)
        paramCount += 2
      } else if (req.user.role === 'GerenteZona') {
        // Reportes en estado EnRevision, Aprobado o Rechazado de estaciones en su zona asignada
        // (Aprobado y Rechazado son los que el gerente de zona aprobó/rechazó)
        let estadosPermitidos = [EstadoReporte.Pendiente, EstadoReporte.Aprobado, EstadoReporte.Rechazado]
        
        // Si hay filtro de estado, aplicarlo
        if (estadoFiltro) {
          if (estadoFiltro === 'Aprobado,Rechazado') {
            // Para historial: solo Aprobado y Rechazado
            estadosPermitidos = [EstadoReporte.Aprobado, EstadoReporte.Rechazado]
          } else if (estadoFiltro === 'Pendiente') {
            // Para revisión: solo EnRevision
            estadosPermitidos = [EstadoReporte.Pendiente]
          } else {
            estadosPermitidos = [estadoFiltro as EstadoReporte]
          }
        }
        
        const filterClause = ` AND r.estado = ANY($${paramCount}::text[]) AND e.zona_id = (
          SELECT zona_id FROM users WHERE id = $${paramCount + 1}
        )`
        query += filterClause
        countQuery += filterClause
        params.push(estadosPermitidos, req.user.id)
        paramCount += 2
      } else if (req.user.role === 'Direccion') {
        // Solo reportes aprobados
        const filterClause = ` AND r.estado = $${paramCount}`
        query += filterClause
        countQuery += filterClause
        params.push(EstadoReporte.Aprobado)
        paramCount++
      } else if (req.user.role === 'Administrador') {
        // Administrador puede filtrar por estado si se especifica
        if (estadoFiltro) {
          if (estadoFiltro === 'Aprobado,Rechazado') {
            const filterClause = ` AND r.estado IN ($${paramCount}, $${paramCount + 1})`
            query += filterClause
            countQuery += filterClause
            params.push(EstadoReporte.Aprobado, EstadoReporte.Rechazado)
            paramCount += 2
          } else {
            const filterClause = ` AND r.estado = $${paramCount}`
            query += filterClause
            countQuery += filterClause
            params.push(estadoFiltro)
            paramCount++
          }
        }
      }

      // Aplicar filtros adicionales (estación, fechas)
      if (estacionIdFiltro) {
        const filterClause = ` AND r.estacion_id = $${paramCount}`
        query += filterClause
        countQuery += filterClause
        params.push(estacionIdFiltro)
        paramCount++
      }

      if (fechaDesdeFiltro) {
        const filterClause = ` AND r.fecha >= $${paramCount}`
        query += filterClause
        countQuery += filterClause
        params.push(fechaDesdeFiltro)
        paramCount++
      }

      if (fechaHastaFiltro) {
        const filterClause = ` AND r.fecha <= $${paramCount}`
        query += filterClause
        countQuery += filterClause
        params.push(fechaHastaFiltro)
        paramCount++
      }

      query += ` ORDER BY r.fecha DESC, r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
      params.push(limit, offset)

      // Ejecutar queries
      const [result, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, -2)) // Excluir limit y offset del count
      ])

      const total = parseInt(countResult.rows[0].total)
      const totalPages = Math.ceil(total / limit)

      // Obtener productos para todos los reportes de una vez (más eficiente)
      const reporteIds = result.rows.map((row) => row.id)
      let productosData: any = {}
      
      if (reporteIds.length > 0) {
        const productosResult = await pool.query(
          `
          SELECT 
            rp.reporte_id,
            rp.*,
            pc.tipo_producto
          FROM reporte_productos rp
          JOIN productos_catalogo pc ON rp.producto_id = pc.id
          WHERE rp.reporte_id = ANY($1)
          `,
          [reporteIds]
        )

        // Agrupar productos por reporte_id
        productosResult.rows.forEach((row) => {
          if (!productosData[row.reporte_id]) {
            productosData[row.reporte_id] = {}
          }
          const tipo = row.tipo_producto.toLowerCase()
          productosData[row.reporte_id][tipo] = {
            producto_id: row.producto_id,
            precio: parseFloat(row.precio || '0'),
            litros_vendidos: parseFloat(row.litros || '0'), // BD usa 'litros'
            importe: parseFloat(row.importe || '0'),
            merma_volumen: parseFloat(row.merma_volumen || '0'),
            merma_importe: parseFloat(row.merma_importe || '0'),
            merma_porcentaje: parseFloat(row.merma_porcentaje || '0'),
            eficiencia_real: parseFloat(row.eficiencia_real || '0'),
            eficiencia_importe: parseFloat(row.eficiencia_importe || '0'),
            eficiencia_real_porcentaje: parseFloat(row.eficiencia_real_porcentaje || '0'),
            inventario_inicial: parseFloat(row.iib || '0'), // BD usa 'iib'
            compras: parseFloat(row.compras || '0'),
            cct: parseFloat(row.cct || '0'),
            v_dsc: parseFloat(row.v_dsc || '0'),
            dc: parseFloat(row.dc || '0'),
            dif_v_dsc: parseFloat(row.dif_v_dsc || '0'),
            inventario_final: parseFloat(row.iffb || '0'), // BD usa 'iffb'
          }
        })
      }

      const reportes = result.rows.map((row) => {
        const productos = productosData[row.id] || {}
        
        // Asegurar que existan premium, magna, diesel (para compatibilidad)
        const defaultProducto = { 
          producto_id: null,
          precio: 0, 
          litros_vendidos: 0, 
          importe: 0, 
          merma_volumen: 0, 
          merma_importe: 0, 
          merma_porcentaje: 0, 
          eficiencia_real: 0,
          eficiencia_importe: 0,
          eficiencia_real_porcentaje: 0,
          inventario_inicial: 0, 
          compras: 0, 
          cct: 0, 
          v_dsc: 0, 
          dc: 0, 
          dif_v_dsc: 0, 
          inventario_final: 0 
        }
        
        // Función helper para transformar snake_case a camelCase
        const transformProducto = (prod: any) => ({
          productoId: prod.producto_id,
          precio: prod.precio,
          litros: prod.litros_vendidos,
          importe: prod.importe,
          mermaVolumen: prod.merma_volumen,
          mermaImporte: prod.merma_importe,
          mermaPorcentaje: prod.merma_porcentaje,
          eficienciaReal: prod.eficiencia_real,
          eficienciaImporte: prod.eficiencia_importe,
          eficienciaRealPorcentaje: prod.eficiencia_real_porcentaje,
          iib: prod.inventario_inicial,
          compras: prod.compras,
          cct: prod.cct,
          vDsc: prod.v_dsc,
          dc: prod.dc,
          difVDsc: prod.dif_v_dsc,
          if: prod.inventario_final,
          iffb: prod.inventario_final,
        })

        const reporte = {
          id: row.id,
          estacionId: row.estacion_id,
          estacionNombre: row.estacion_nombre,
          zonaNombre: row.zona_nombre,
          fecha: row.fecha,
          aceites: parseFloat(row.aceites || '0'),
          premium: transformProducto(productos.premium || defaultProducto),
          magna: transformProducto(productos.magna || defaultProducto),
          diesel: transformProducto(productos.diesel || defaultProducto),
          estado: row.estado,
          creadoPor: row.creado_por_nombre || row.creado_por,
          revisadoPor: row.revisado_por_nombre || row.revisado_por,
          fechaCreacion: row.fecha_creacion,
          fechaRevision: row.fecha_revision,
          comentarios: row.comentarios,
        }
        
        return reporte
      })

      res.json({
        data: reportes,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      })
    } catch (error) {
      console.error('Error al obtener reportes:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getReporteById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const result = await pool.query(
        `
        SELECT 
          r.*,
          e.nombre as estacion_nombre,
          z.nombre as zona_nombre,
          u1.name as creado_por_nombre,
          u2.name as revisado_por_nombre
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        JOIN zonas z ON e.zona_id = z.id
        LEFT JOIN users u1 ON r.creado_por = u1.id
        LEFT JOIN users u2 ON r.revisado_por = u2.id
        WHERE r.id = $1
        `,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Reporte no encontrado' })
      }

      const row = result.rows[0]
      
      // Obtener productos usando la función helper
      const productos = await obtenerProductosReporte(id)
      const defaultProducto = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }
      
      const reporte = {
        id: row.id,
        estacionId: row.estacion_id,
        estacionNombre: row.estacion_nombre,
        zonaNombre: row.zona_nombre,
        fecha: row.fecha,
        aceites: parseFloat(row.aceites || '0'),
        premium: productos.premium || defaultProducto,
        magna: productos.magna || defaultProducto,
        diesel: productos.diesel || defaultProducto,
        estado: row.estado,
        creadoPor: row.creado_por_nombre || row.creado_por,
        revisadoPor: row.revisado_por_nombre || row.revisado_por,
        fechaCreacion: row.fecha_creacion,
        fechaRevision: row.fecha_revision,
        comentarios: row.comentarios,
      }

      res.json(reporte)
    } catch (error) {
      console.error('Error al obtener reporte:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async createReporte(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { estacionId, fecha, aceites, premium, magna, diesel } = req.body

      // Validaciones
      if (!estacionId || !fecha || !premium || !magna || !diesel) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' })
      }

      // Verificar que el usuario tenga acceso a la estación
      const estacionCheck = await pool.query(
        `
        SELECT e.* FROM estaciones e
        JOIN user_estaciones ue ON e.id = ue.estacion_id
        WHERE e.id = $1 AND ue.user_id = $2
        `,
        [estacionId, req.user.id]
      )

      if (estacionCheck.rows.length === 0 && req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes acceso a esta estación' })
      }

      // Calcular importe si no viene (precio * litros)
      const premiumImporte = premium.importe || premium.precio * premium.litros
      const magnaImporte = magna.importe || magna.precio * magna.litros
      const dieselImporte = diesel.importe || diesel.precio * diesel.litros

      // Obtener I.I.B. para cada producto
      // Si es el día 1 del mes, usar el valor proporcionado
      // Si no es el día 1, SIEMPRE obtener del I.F.F.B. del día anterior (ignorar el valor del body)
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      const fechaParts = fecha.split('-')
      const fechaObj = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]))
      const esDiaUno = fechaObj.getDate() === 1
      
      console.log('[CREATE] Fecha recibida:', fecha, 'Fecha parseada:', fechaObj.toISOString().split('T')[0], 'Es día 1:', esDiaUno)

      let premiumIib = premium.iib || 0
      let magnaIib = magna.iib || 0
      let dieselIib = diesel.iib || 0

      if (!esDiaUno) {
        // Obtener el reporte del día anterior para tomar el I.F.F.B.
        const fechaAnterior = new Date(fechaObj)
        fechaAnterior.setDate(fechaAnterior.getDate() - 1)
        const fechaAnteriorStr = fechaAnterior.toISOString().split('T')[0]

        console.log('[CREATE] Buscando reporte anterior para fecha:', fechaAnteriorStr, 'Estación:', estacionId)

        // Obtener I.F.F.B. del día anterior desde reporte_productos
        const reporteAnterior = await pool.query(
          `
          SELECT r.id
          FROM reportes r
          WHERE r.estacion_id = $1 AND r.fecha = $2
          ORDER BY r.fecha_creacion DESC
          LIMIT 1
          `,
          [estacionId, fechaAnteriorStr]
        )

        if (reporteAnterior.rows.length > 0) {
          const reporteAnteriorId = reporteAnterior.rows[0].id
          const productosAnteriores = await obtenerProductosReporte(reporteAnteriorId)
          
          premiumIib = productosAnteriores.premium?.iffb || 0
          magnaIib = productosAnteriores.magna?.iffb || 0
          dieselIib = productosAnteriores.diesel?.iffb || 0
          console.log('[CREATE] I.I.B. obtenido del día anterior - Premium:', premiumIib, 'Magna:', magnaIib, 'Diesel:', dieselIib)
        } else {
          console.log('[CREATE] No se encontró reporte anterior para fecha:', fechaAnteriorStr)
        }
      } else {
        console.log('[CREATE] Es día 1, usando I.I.B. proporcionado - Premium:', premiumIib, 'Magna:', magnaIib, 'Diesel:', dieselIib)
      }

      // Calcular campos calculados para cada producto
      // DC = CCT - C
      const premiumDc = (premium.cct || 0) - (premium.compras || 0)
      const magnaDc = (magna.cct || 0) - (magna.compras || 0)
      const dieselDc = (diesel.cct || 0) - (diesel.compras || 0)

      // Dif V. Dsc = DC - V. Dsc
      const premiumDifVDsc = premiumDc - (premium.vDsc || 0)
      const magnaDifVDsc = magnaDc - (magna.vDsc || 0)
      const dieselDifVDsc = dieselDc - (diesel.vDsc || 0)

      // I.F. = I.I.B. + Compras - Ventas (litros)
      // Nota: El volumen de merma ya está incluido en los litros vendidos
      const premiumIf = premiumIib + (premium.compras || 0) - (premium.litros || 0)
      const magnaIf = magnaIib + (magna.compras || 0) - (magna.litros || 0)
      const dieselIf = dieselIib + (diesel.compras || 0) - (diesel.litros || 0)

      // Preparar productos con valores calculados
      const productosParaGuardar = {
        premium: {
          ...premium,
          iib: premiumIib,
          importe: premiumImporte,
          dc: premiumDc,
          difVDsc: premiumDifVDsc,
          if: premiumIf,
        },
        magna: {
          ...magna,
          iib: magnaIib,
          importe: magnaImporte,
          dc: magnaDc,
          difVDsc: magnaDifVDsc,
          if: magnaIf,
        },
        diesel: {
          ...diesel,
          iib: dieselIib,
          importe: dieselImporte,
          dc: dieselDc,
          difVDsc: dieselDifVDsc,
          if: dieselIf,
        },
      }

      // Insertar solo campos generales del reporte
      const result = await pool.query(
        `
        INSERT INTO reportes (
          estacion_id, fecha, aceites, estado, creado_por
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
          estacionId,
          fecha,
          aceites || 0,
          EstadoReporte.Pendiente,
          req.user.id,
        ]
      )

      const reporte = result.rows[0]

      // Guardar productos usando la función helper
      await guardarProductosReporte(reporte.id, productosParaGuardar, false)

      // Obtener información de la estación para la auditoría
      const estacionInfo = await pool.query(
        `SELECT nombre FROM estaciones WHERE id = $1`,
        [estacionId]
      )
      const estacionNombre = estacionInfo.rows[0]?.nombre || estacionId

      // Registrar auditoría con información más detallada
      await registrarAuditoria(
        reporte.id,
        req.user.id,
        req.user.name || req.user.email,
        'CREAR',
        undefined,
        undefined,
        undefined,
        `Reporte creado para estación "${estacionNombre}" con fecha ${fecha}. Premium: ${premium.litros}L @ $${premium.precio}, Magna: ${magna.litros}L @ $${magna.precio}, Diesel: ${diesel.litros}L @ $${diesel.precio}`,
        fecha
      )

      // Obtener información completa del reporte
      const fullResult = await pool.query(
        `
        SELECT 
          r.*,
          e.nombre as estacion_nombre,
          z.nombre as zona_nombre
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        JOIN zonas z ON e.zona_id = z.id
        WHERE r.id = $1
        `,
        [reporte.id]
      )

      const row = fullResult.rows[0]
      
      // Obtener productos usando la función helper
      const productos = await obtenerProductosReporte(reporte.id)
      const defaultProducto = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }
      
      const reporteCompleto = {
        id: row.id,
        estacionId: row.estacion_id,
        estacionNombre: row.estacion_nombre,
        zonaNombre: row.zona_nombre,
        fecha: row.fecha,
        aceites: parseFloat(row.aceites || '0'),
        premium: productos.premium || defaultProducto,
        magna: productos.magna || defaultProducto,
        diesel: productos.diesel || defaultProducto,
        estado: row.estado,
        creadoPor: row.creado_por_nombre || req.user.id,
        fechaCreacion: row.fecha_creacion,
      }

      res.status(201).json(reporteCompleto)
    } catch (error) {
      console.error('Error al crear reporte:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async updateEstado(req: AuthRequest, res: Response) {
    try {
      console.log(`[updateEstado] INICIO - Usuario: ${req.user?.id}, Rol: ${req.user?.role}`)
      
      if (!req.user) {
        console.log(`[updateEstado] ERROR: No autenticado`)
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { id } = req.params
      const { estado, comentarios } = req.body

      console.log(`[updateEstado] Parámetros: id=${id}, estado=${estado}, comentarios=${comentarios}`)

      if (!estado || !Object.values(EstadoReporte).includes(estado)) {
        console.log(`[updateEstado] ERROR: Estado inválido: ${estado}`)
        return res.status(400).json({ message: 'Estado inválido' })
      }

      // Obtener información del reporte
      const reporteCheck = await pool.query(
        `
        SELECT r.estado, r.estacion_id, r.creado_por, e.zona_id, e.nombre as estacion_nombre
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        WHERE r.id = $1
        `,
        [id]
      )

      if (reporteCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Reporte no encontrado' })
      }

      const reporteActual = reporteCheck.rows[0]
      const estadoActual = reporteActual.estado
      const zonaId = reporteActual.zona_id
      const estacionId = reporteActual.estacion_id
      const creadoPor = reporteActual.creado_por

      console.log(`[updateEstado] Usuario: ${req.user.id}, Rol: ${req.user.role}, Reporte: ${id}, Estación: ${estacionId}, Estado actual: ${estadoActual}`)

      // Validar transiciones de estado según el rol
      if (req.user.role === 'GerenteEstacion') {
        // Gerente de Estación solo puede aprobar o rechazar reportes Pendientes de sus estaciones
        if (estadoActual !== EstadoReporte.Pendiente) {
          console.log(`[updateEstado] Error: Estado actual ${estadoActual} no es Pendiente`)
          return res.status(403).json({ 
            message: `Solo puedes aprobar o rechazar reportes pendientes. Estado actual: ${estadoActual}` 
          })
        }

        // Verificar que la estación esté asignada al usuario
        // Usar casting explícito a UUID para evitar problemas de tipos
        const estacionAsignada = await pool.query(
          `SELECT * FROM user_estaciones 
           WHERE user_id::uuid = $1::uuid AND estacion_id::uuid = $2::uuid`,
          [req.user.id, estacionId]
        )

        console.log(`[updateEstado] Verificación de acceso: Usuario ${req.user.id} (${typeof req.user.id}), Estación ${estacionId} (${typeof estacionId}), Resultado: ${estacionAsignada.rows.length} asignaciones encontradas`)

        if (estacionAsignada.rows.length === 0) {
          // Verificar todas las asignaciones del usuario para debug
          const todasAsignaciones = await pool.query(
            'SELECT estacion_id FROM user_estaciones WHERE user_id = $1',
            [req.user.id]
          )
          console.log(`[updateEstado] Usuario ${req.user.id} tiene ${todasAsignaciones.rows.length} estaciones asignadas:`, todasAsignaciones.rows.map(r => r.estacion_id))
          console.log(`[updateEstado] Reporte creado por: ${creadoPor}, Usuario actual: ${req.user.id}`)
          console.log(`[updateEstado] Estación del reporte: ${estacionId}, Tipo: ${typeof estacionId}`)
          
          // Verificar si existe la asignación con diferentes tipos de datos
          const estacionAsignadaV2 = await pool.query(
            'SELECT * FROM user_estaciones WHERE user_id::text = $1 AND estacion_id::text = $2',
            [req.user.id.toString(), estacionId.toString()]
          )
          console.log(`[updateEstado] Verificación alternativa (como texto): ${estacionAsignadaV2.rows.length} asignaciones encontradas`)
          
          return res.status(403).json({ 
            message: `No tienes acceso a esta estación (${estacionId}). Contacta al administrador para que te asigne a esta estación.` 
          })
        }

        // Gerente de Estación puede aprobar o rechazar sus propios reportes
        if (estado !== EstadoReporte.Aprobado && estado !== EstadoReporte.Rechazado) {
          return res.status(400).json({ message: 'Solo puedes aprobar o rechazar el reporte' })
        }
      } else if (req.user.role === 'GerenteZona') {
        // Gerente de Zona puede rechazar reportes aprobados si encuentra errores
        if (estadoActual !== EstadoReporte.Aprobado) {
          return res.status(403).json({ message: 'Solo puedes rechazar reportes aprobados para corrección' })
        }

        // Verificar que el usuario tenga acceso a la zona
        const zonaCheck = await pool.query(
          'SELECT * FROM user_zonas WHERE user_id = $1 AND zona_id = $2',
          [req.user.id, zonaId]
        )

        if (zonaCheck.rows.length === 0) {
          return res.status(403).json({ message: 'No tienes acceso a esta zona' })
        }

        // Solo puede rechazar (para que el Gerente de Estación corrija)
        if (estado !== EstadoReporte.Rechazado) {
          return res.status(400).json({ message: 'Solo puedes rechazar el reporte para solicitar correcciones' })
        }
      } else if (req.user.role === 'Direccion') {
        // Director solo puede ver, no puede cambiar estados
        return res.status(403).json({ message: 'No tienes permiso para cambiar el estado del reporte' })
      } else if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para cambiar el estado del reporte' })
      }

      const result = await pool.query(
        `
        UPDATE reportes
        SET estado = $1,
            revisado_por = $2,
            fecha_revision = CURRENT_TIMESTAMP,
            comentarios = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
        `,
        [estado, req.user.id, comentarios || null, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Reporte no encontrado' })
      }

      // Registrar auditoría
      const accionAuditoria = estado === EstadoReporte.Aprobado ? 'APROBAR' : estado === EstadoReporte.Rechazado ? 'RECHAZAR' : 'CAMBIO_ESTADO'
      await registrarAuditoria(
        id,
        req.user.id,
        req.user.name || req.user.email,
        accionAuditoria,
        'estado',
        estadoActual,
        estado,
        comentarios || `Estado cambiado de ${estadoActual} a ${estado}`
      )

      // Obtener información completa
      const fullResult = await pool.query(
        `
        SELECT 
          r.*,
          e.nombre as estacion_nombre,
          z.nombre as zona_nombre,
          u2.name as revisado_por_nombre
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        JOIN zonas z ON e.zona_id = z.id
        LEFT JOIN users u2 ON r.revisado_por = u2.id
        WHERE r.id = $1
        `,
        [id]
      )

      const row = fullResult.rows[0]
      
      // Obtener productos usando la función helper
      const productos = await obtenerProductosReporte(id)
      const defaultProducto = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }
      
      const reporte = {
        id: row.id,
        estacionId: row.estacion_id,
        estacionNombre: row.estacion_nombre,
        zonaNombre: row.zona_nombre,
        fecha: row.fecha,
        aceites: parseFloat(row.aceites || '0'),
        premium: productos.premium || defaultProducto,
        magna: productos.magna || defaultProducto,
        diesel: productos.diesel || defaultProducto,
        estado: row.estado,
        creadoPor: row.creado_por_nombre || row.creado_por,
        revisadoPor: row.revisado_por_nombre || row.revisado_por,
        fechaCreacion: row.fecha_creacion,
        fechaRevision: row.fecha_revision,
        comentarios: row.comentarios,
      }

      res.json(reporte)
    } catch (error) {
      console.error('Error al actualizar estado:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async updateReporte(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { id } = req.params
      const { estacionId, fecha, aceites, premium, magna, diesel } = req.body

      // Validaciones
      if (!estacionId || !fecha || !premium || !magna || !diesel) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' })
      }

      // Verificar que el reporte existe y pertenece al usuario (solo si está pendiente)
      const reporteCheck = await pool.query(
        `
        SELECT r.*, e.zona_id 
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        WHERE r.id = $1
        `,
        [id]
      )

      if (reporteCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Reporte no encontrado' })
      }

      const reporte = reporteCheck.rows[0]

      console.log('=== DEBUG updateReporte ===')
      console.log('Usuario ID:', req.user.id)
      console.log('Usuario Role:', req.user.role)
      console.log('Reporte Estado:', reporte.estado)
      console.log('Reporte Creado Por:', reporte.creado_por)
      console.log('Estacion ID del reporte original:', reporte.estacion_id)
      console.log('Estacion ID del body:', estacionId)

      // Verificar roles
      const esAdministrador = req.user.role === 'Administrador'
      const esGerenteEstacion = req.user.role === 'GerenteEstacion'
      const esGerenteZona = req.user.role === 'GerenteZona'

      // Verificar acceso a la estación según el rol
      const estacionIdParaVerificar = estacionId || reporte.estacion_id
      let tieneAccesoEstacion = false

      if (esAdministrador) {
        tieneAccesoEstacion = true
      } else if (esGerenteEstacion) {
        // Gerente de Estación: verificar asignación directa
        const estacionCheck = await pool.query(
          `
          SELECT e.* FROM estaciones e
          JOIN user_estaciones ue ON e.id = ue.estacion_id
          WHERE e.id = $1 AND ue.user_id = $2
          `,
          [estacionIdParaVerificar, req.user.id]
        )
        tieneAccesoEstacion = estacionCheck.rows.length > 0
        console.log('GerenteEstacion - Estaciones asignadas:', estacionCheck.rows.length)
      } else if (esGerenteZona) {
        // Gerente de Zona: verificar que la estación pertenezca a su zona
        const zonaCheck = await pool.query(
          `
          SELECT e.* FROM estaciones e
          JOIN users u ON u.zona_id = e.zona_id
          WHERE e.id = $1 AND u.id = $2
          `,
          [estacionIdParaVerificar, req.user.id]
        )
        tieneAccesoEstacion = zonaCheck.rows.length > 0
        console.log('GerenteZona - Estación pertenece a su zona:', zonaCheck.rows.length)
      }

      // Verificar permisos según el estado del reporte y el rol:
      // - Administrador: puede editar cualquier reporte en cualquier estado
      // - GerenteEstacion: puede editar reportes PENDIENTES de sus estaciones
      // - GerenteZona: puede editar reportes APROBADOS de su zona (para correcciones)
      const esCreador = reporte.creado_por === req.user.id
      const reporteEstaPendiente = reporte.estado === EstadoReporte.Pendiente
      const reporteEstaAprobado = reporte.estado === EstadoReporte.Aprobado

      let puedeEditar = false
      let razonDenegacion = ''

      if (esAdministrador) {
        puedeEditar = true
      } else if (esGerenteEstacion) {
        // Gerente de Estación solo puede editar reportes pendientes de sus estaciones
        if (!tieneAccesoEstacion) {
          razonDenegacion = 'No tienes acceso a esta estación'
        } else if (!reporteEstaPendiente) {
          razonDenegacion = `Solo puedes editar reportes pendientes. Este reporte está: ${reporte.estado}`
        } else {
          puedeEditar = true
        }
      } else if (esGerenteZona) {
        // Gerente de Zona puede editar reportes aprobados de su zona (para correcciones)
        if (!tieneAccesoEstacion) {
          razonDenegacion = 'Esta estación no pertenece a tu zona'
        } else if (!reporteEstaAprobado) {
          razonDenegacion = `Solo puedes corregir reportes aprobados. Este reporte está: ${reporte.estado}`
        } else {
          puedeEditar = true
        }
      } else {
        razonDenegacion = 'Tu rol no tiene permisos para editar reportes'
      }

      if (!puedeEditar) {
        console.log('ERROR: Permiso denegado.', {
          usuario: req.user.id,
          rol: req.user.role,
          reporteEstado: reporte.estado,
          tieneAccesoEstacion,
          razon: razonDenegacion
        })
        return res.status(403).json({ 
          message: razonDenegacion
        })
      }

      console.log('Permisos validados OK:', {
        rol: req.user.role,
        reporteEstado: reporte.estado,
        tieneAccesoEstacion
      })

      console.log('Validaciones pasadas, procediendo a actualizar...')

      // Siempre recalcular importe basado en precio * litros (no usar el importe del body)
      const premiumImporte = premium.precio * premium.litros
      const magnaImporte = magna.precio * magna.litros
      const dieselImporte = diesel.precio * diesel.litros
      
      console.log('Importes calculados - Premium:', premiumImporte, 'Magna:', magnaImporte, 'Diesel:', dieselImporte)

      // Obtener I.I.B. para cada producto
      // Si es el día 1 del mes, usar el valor proporcionado
      // Si no es el día 1, SIEMPRE obtener del I.F.F.B. del día anterior (ignorar el valor del body)
      // Parsear la fecha manualmente para evitar problemas de zona horaria
      const fechaParts = fecha.split('-')
      const fechaObj = new Date(parseInt(fechaParts[0]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[2]))
      const esDiaUno = fechaObj.getDate() === 1
      
      console.log('[UPDATE] Fecha recibida:', fecha, 'Fecha parseada:', fechaObj.toISOString().split('T')[0], 'Es día 1:', esDiaUno)

      let premiumIib = premium.iib || 0
      let magnaIib = magna.iib || 0
      let dieselIib = diesel.iib || 0

      if (!esDiaUno) {
        // Obtener el reporte del día anterior para tomar el I.F.F.B.
        const fechaAnterior = new Date(fechaObj)
        fechaAnterior.setDate(fechaAnterior.getDate() - 1)
        const fechaAnteriorStr = fechaAnterior.toISOString().split('T')[0]

        console.log('[UPDATE] Buscando reporte anterior para fecha:', fechaAnteriorStr, 'Estación:', estacionId)

        // Obtener I.F.F.B. del día anterior desde reporte_productos
        const reporteAnterior = await pool.query(
          `
          SELECT r.id
          FROM reportes r
          WHERE r.estacion_id = $1 AND r.fecha = $2
          ORDER BY r.fecha_creacion DESC
          LIMIT 1
          `,
          [estacionId, fechaAnteriorStr]
        )

        if (reporteAnterior.rows.length > 0) {
          const reporteAnteriorId = reporteAnterior.rows[0].id
          const productosAnteriores = await obtenerProductosReporte(reporteAnteriorId)
          
          premiumIib = productosAnteriores.premium?.iffb || 0
          magnaIib = productosAnteriores.magna?.iffb || 0
          dieselIib = productosAnteriores.diesel?.iffb || 0
          console.log('[UPDATE] I.I.B. obtenido del día anterior - Premium:', premiumIib, 'Magna:', magnaIib, 'Diesel:', dieselIib)
        } else {
          console.log('[UPDATE] No se encontró reporte anterior para fecha:', fechaAnteriorStr)
        }
      } else {
        console.log('[UPDATE] Es día 1, usando I.I.B. proporcionado - Premium:', premiumIib, 'Magna:', magnaIib, 'Diesel:', dieselIib)
      }

      // Calcular campos calculados para cada producto
      // DC = CCT - C
      const premiumDc = (premium.cct || 0) - (premium.compras || 0)
      const magnaDc = (magna.cct || 0) - (magna.compras || 0)
      const dieselDc = (diesel.cct || 0) - (diesel.compras || 0)

      // Dif V. Dsc = DC - V. Dsc
      const premiumDifVDsc = premiumDc - (premium.vDsc || 0)
      const magnaDifVDsc = magnaDc - (magna.vDsc || 0)
      const dieselDifVDsc = dieselDc - (diesel.vDsc || 0)

      // I.F. = I.I.B. + Compras - Ventas (litros)
      // Nota: El volumen de merma ya está incluido en los litros vendidos
      const premiumIf = premiumIib + (premium.compras || 0) - (premium.litros || 0)
      const magnaIf = magnaIib + (magna.compras || 0) - (magna.litros || 0)
      const dieselIf = dieselIib + (diesel.compras || 0) - (diesel.litros || 0)

      console.log('=== Valores calculados ===')
      console.log('Premium - I.I.B.:', premiumIib, 'Compras:', premium.compras || 0, 'Litros (Ventas):', premium.litros || 0, 'I.F.:', premiumIf)
      console.log('Magna - I.I.B.:', magnaIib, 'Compras:', magna.compras || 0, 'Litros (Ventas):', magna.litros || 0, 'I.F.:', magnaIf)
      console.log('Diesel - I.I.B.:', dieselIib, 'Compras:', diesel.compras || 0, 'Litros (Ventas):', diesel.litros || 0, 'I.F.:', dieselIf)
      console.log('DC Premium:', premiumDc, 'DC Magna:', magnaDc, 'DC Diesel:', dieselDc)
      console.log('Dif V. Dsc Premium:', premiumDifVDsc, 'Dif V. Dsc Magna:', magnaDifVDsc, 'Dif V. Dsc Diesel:', dieselDifVDsc)

      // Obtener valores anteriores para comparar (usando la nueva estructura)
      const productosAnteriores = await obtenerProductosReporte(id)
      const valoresAnteriores = {
        estacion_id: reporte.estacion_id,
        fecha: reporte.fecha,
        aceites: parseFloat(reporte.aceites || '0'),
        premium: productosAnteriores.premium || { precio: 0, litros: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, iffb: 0 },
        magna: productosAnteriores.magna || { precio: 0, litros: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, iffb: 0 },
        diesel: productosAnteriores.diesel || { precio: 0, litros: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, iffb: 0 },
      }

      // Obtener nombre de la estación anterior y nueva
      const estacionAnteriorInfo = await pool.query(
        `SELECT nombre FROM estaciones WHERE id = $1`,
        [valoresAnteriores.estacion_id]
      )
      const estacionNuevaInfo = await pool.query(
        `SELECT nombre FROM estaciones WHERE id = $1`,
        [estacionId]
      )
      const estacionAnteriorNombre = estacionAnteriorInfo.rows[0]?.nombre || valoresAnteriores.estacion_id
      const estacionNuevaNombre = estacionNuevaInfo.rows[0]?.nombre || estacionId

      // Preparar productos con valores calculados
      const productosParaGuardar = {
        premium: {
          ...premium,
          iib: premiumIib,
          importe: premiumImporte,
          dc: premiumDc,
          difVDsc: premiumDifVDsc,
          if: premiumIf,
        },
        magna: {
          ...magna,
          iib: magnaIib,
          importe: magnaImporte,
          dc: magnaDc,
          difVDsc: magnaDifVDsc,
          if: magnaIf,
        },
        diesel: {
          ...diesel,
          iib: dieselIib,
          importe: dieselImporte,
          dc: dieselDc,
          difVDsc: dieselDifVDsc,
          if: dieselIf,
        },
      }

      // Actualizar solo campos generales del reporte
      const result = await pool.query(
        `
        UPDATE reportes
        SET estacion_id = $1,
            fecha = $2,
            aceites = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
        `,
        [
          estacionId,
          fecha,
          aceites || 0,
          id,
        ]
      )

      // Actualizar productos usando la función helper
      try {
        await guardarProductosReporte(id, productosParaGuardar, true)
      } catch (error: any) {
        console.error('Error al guardar productos del reporte:', error)
        throw new Error(`Error al guardar productos: ${error.message}`)
      }

      // Comparar valores y registrar cambios
      const cambios: string[] = []

      // Estación
      if (valoresAnteriores.estacion_id !== estacionId) {
        cambios.push(`Estación: "${estacionAnteriorNombre}" → "${estacionNuevaNombre}"`)
      }

      // Fecha
      if (valoresAnteriores.fecha !== fecha) {
        cambios.push(`Fecha: ${valoresAnteriores.fecha} → ${fecha}`)
      }

      // Aceites
      if (Math.abs(valoresAnteriores.aceites - (aceites || 0)) > 0.01) {
        cambios.push(`Aceites: $${valoresAnteriores.aceites.toFixed(2)} → $${(aceites || 0).toFixed(2)}`)
      }

      // Función helper para comparar campos de combustible
      const compararCombustible = (
        nombre: string,
        anterior: any,
        nuevo: any,
        campos: string[]
      ) => {
        campos.forEach((campo) => {
          const valorAnterior = anterior[campo] || 0
          const valorNuevo = nuevo[campo] || 0
          if (Math.abs(valorAnterior - valorNuevo) > 0.01) {
            const campoLabel = campo.charAt(0).toUpperCase() + campo.slice(1).replace(/([A-Z])/g, ' $1')
            cambios.push(`${nombre} ${campoLabel}: ${valorAnterior.toFixed(2)} → ${valorNuevo.toFixed(2)}`)
          }
        })
      }

      // Premium
      compararCombustible('Premium', valoresAnteriores.premium, premium, [
        'precio',
        'litros',
        'mermaVolumen',
        'mermaImporte',
        'mermaPorcentaje',
        'iib',
        'compras',
        'cct',
        'vDsc',
        'iffb',
      ])

      // Magna
      compararCombustible('Magna', valoresAnteriores.magna, magna, [
        'precio',
        'litros',
        'mermaVolumen',
        'mermaImporte',
        'mermaPorcentaje',
        'iib',
        'compras',
        'cct',
        'vDsc',
        'iffb',
      ])

      // Diesel
      compararCombustible('Diesel', valoresAnteriores.diesel, diesel, [
        'precio',
        'litros',
        'mermaVolumen',
        'mermaImporte',
        'mermaPorcentaje',
        'iib',
        'compras',
        'cct',
        'vDsc',
        'iffb',
      ])

      // Registrar auditoría con los cambios detectados
      if (cambios.length > 0) {
        // Si hay muchos cambios (más de 5), consolidar en un solo registro
        if (cambios.length > 5) {
          await registrarAuditoria(
            id,
            req.user.id,
            req.user.name || req.user.email,
            'ACTUALIZAR',
            'Múltiples campos',
            undefined,
            undefined,
            `Reporte actualizado por ${req.user.name || req.user.email}. Cambios: ${cambios.join('; ')}`,
            fecha
          )
        } else {
          // Registrar un log por cada campo que cambió (máximo 5 para no saturar)
          for (const cambio of cambios) {
            const [campo, valores] = cambio.split(': ')
            const [valorAnterior, valorNuevo] = valores ? valores.split(' → ') : ['', '']
            
            await registrarAuditoria(
              id,
              req.user.id,
              req.user.name || req.user.email,
              'ACTUALIZAR',
              campo.trim(),
              valorAnterior.trim(),
              valorNuevo.trim(),
              `Campo "${campo.trim()}" actualizado`,
              fecha
            )
          }
        }
      } else {
        // Si no hay cambios detectados, registrar un log general
        await registrarAuditoria(
          id,
          req.user.id,
          req.user.name || req.user.email,
          'ACTUALIZAR',
          undefined,
          undefined,
          undefined,
          `Reporte actualizado por ${req.user.name || req.user.email} (sin cambios detectados)`,
          fecha
        )
      }

      // Si se actualizó el I.F.F.B., actualizar el I.I.B. del día siguiente si existe
      const fechaSiguiente = new Date(fechaObj)
      fechaSiguiente.setDate(fechaSiguiente.getDate() + 1)
      const fechaSiguienteStr = fechaSiguiente.toISOString().split('T')[0]
      const esDiaSiguienteDelMes = fechaSiguiente.getDate() !== 1 // No actualizar si el día siguiente es día 1 (ese se captura manualmente)
      
      console.log('[UPDATE] Verificando día siguiente - Fecha siguiente:', fechaSiguienteStr, 'Es día 1 del mes siguiente:', !esDiaSiguienteDelMes)

      if (esDiaSiguienteDelMes) {
        // Buscar si existe un reporte del día siguiente
        const reporteSiguiente = await pool.query(
          `
          SELECT id
          FROM reportes
          WHERE estacion_id = $1 AND fecha = $2
          LIMIT 1
          `,
          [estacionId, fechaSiguienteStr]
        )

        if (reporteSiguiente.rows.length > 0) {
          const reporteSiguienteId = reporteSiguiente.rows[0].id
          // Usar los valores de I.F.F.B. que acabamos de guardar
          const nuevoPremiumIib = parseFloat((premium.iffb || 0).toString())
          const nuevoMagnaIib = parseFloat((magna.iffb || 0).toString())
          const nuevoDieselIib = parseFloat((diesel.iffb || 0).toString())

          // Obtener productos del día siguiente
          const productosSiguiente = await obtenerProductosReporte(reporteSiguienteId)
          
          // Obtener IDs de productos del catálogo
          const productosCatalogo = await pool.query(
            `SELECT id, tipo_producto FROM productos_catalogo WHERE activo = true`
          )
          const productosMap = new Map<string, string>()
          productosCatalogo.rows.forEach((row) => {
            productosMap.set(row.tipo_producto.toLowerCase(), row.id)
          })

          // Actualizar I.I.B. de cada producto en reporte_productos
          const premiumId = productosMap.get('premium')
          const magnaId = productosMap.get('magna')
          const dieselId = productosMap.get('diesel')

          if (premiumId) {
            await pool.query(
              `UPDATE reporte_productos SET iib = $1, updated_at = CURRENT_TIMESTAMP WHERE reporte_id = $2 AND producto_id = $3`,
              [nuevoPremiumIib, reporteSiguienteId, premiumId]
            )
          }
          if (magnaId) {
            await pool.query(
              `UPDATE reporte_productos SET iib = $1, updated_at = CURRENT_TIMESTAMP WHERE reporte_id = $2 AND producto_id = $3`,
              [nuevoMagnaIib, reporteSiguienteId, magnaId]
            )
          }
          if (dieselId) {
            await pool.query(
              `UPDATE reporte_productos SET iib = $1, updated_at = CURRENT_TIMESTAMP WHERE reporte_id = $2 AND producto_id = $3`,
              [nuevoDieselIib, reporteSiguienteId, dieselId]
            )
          }

          console.log('[UPDATE] I.I.B. del día siguiente actualizado - Premium:', nuevoPremiumIib, 'Magna:', nuevoMagnaIib, 'Diesel:', nuevoDieselIib)

          // Recalcular I.F. del día siguiente con el nuevo I.I.B.
          const nuevoPremiumIf = nuevoPremiumIib + (productosSiguiente.premium?.compras || 0) - (productosSiguiente.premium?.litros || 0)
          const nuevoMagnaIf = nuevoMagnaIib + (productosSiguiente.magna?.compras || 0) - (productosSiguiente.magna?.litros || 0)
          const nuevoDieselIf = nuevoDieselIib + (productosSiguiente.diesel?.compras || 0) - (productosSiguiente.diesel?.litros || 0)

          // Actualizar I.F. en reporte_productos
          if (premiumId) {
            await pool.query(
              `UPDATE reporte_productos SET if = $1, updated_at = CURRENT_TIMESTAMP WHERE reporte_id = $2 AND producto_id = $3`,
              [nuevoPremiumIf, reporteSiguienteId, premiumId]
            )
          }
          if (magnaId) {
            await pool.query(
              `UPDATE reporte_productos SET if = $1, updated_at = CURRENT_TIMESTAMP WHERE reporte_id = $2 AND producto_id = $3`,
              [nuevoMagnaIf, reporteSiguienteId, magnaId]
            )
          }
          if (dieselId) {
            await pool.query(
              `UPDATE reporte_productos SET if = $1, updated_at = CURRENT_TIMESTAMP WHERE reporte_id = $2 AND producto_id = $3`,
              [nuevoDieselIf, reporteSiguienteId, dieselId]
            )
          }

          console.log('[UPDATE] I.F. del día siguiente recalculado - Premium:', nuevoPremiumIf, 'Magna:', nuevoMagnaIf, 'Diesel:', nuevoDieselIf)
        }
      }

      // Obtener información completa del reporte actualizado usando la nueva estructura
      const fullResult = await pool.query(
        `
        SELECT 
          r.*,
          e.nombre as estacion_nombre,
          z.nombre as zona_nombre,
          u1.name as creado_por_nombre,
          u2.name as revisado_por_nombre
        FROM reportes r
        JOIN estaciones e ON r.estacion_id = e.id
        JOIN zonas z ON e.zona_id = z.id
        LEFT JOIN users u1 ON r.creado_por = u1.id
        LEFT JOIN users u2 ON r.revisado_por = u2.id
        WHERE r.id = $1
        `,
        [id]
      )

      const row = fullResult.rows[0]
      
      // Obtener productos usando la función helper
      const productosActualizados = await obtenerProductosReporte(id)
      const defaultProducto = { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 }
      
      const reporteCompleto = {
        id: row.id,
        estacionId: row.estacion_id,
        estacionNombre: row.estacion_nombre,
        zonaNombre: row.zona_nombre,
        fecha: row.fecha,
        aceites: parseFloat(row.aceites || '0'),
        premium: productosActualizados.premium || defaultProducto,
        magna: productosActualizados.magna || defaultProducto,
        diesel: productosActualizados.diesel || defaultProducto,
        estado: row.estado,
        creadoPor: row.creado_por_nombre || row.creado_por,
        revisadoPor: row.revisado_por_nombre || row.revisado_por,
        fechaCreacion: row.created_at,
        fechaRevision: row.fecha_revision,
        comentarios: row.comentarios,
      }

      res.json(reporteCompleto)
    } catch (error: any) {
      console.error('Error al actualizar reporte:', error)
      console.error('Stack trace:', error.stack)
      res.status(500).json({ 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  },

  async actualizarReportesConValoresAleatorios(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden ejecutar esta acción
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden ejecutar esta acción' })
      }

      // Obtener todos los reportes con sus productos
      const result = await pool.query('SELECT id, estacion_id, fecha FROM reportes ORDER BY fecha DESC')

      // Obtener IDs de productos del catálogo
      const productosCatalogo = await pool.query(
        `SELECT id, tipo_producto FROM productos_catalogo WHERE activo = true`
      )
      const productosMap = new Map<string, string>()
      productosCatalogo.rows.forEach((row) => {
        productosMap.set(row.tipo_producto.toLowerCase(), row.id)
      })

      const premiumId = productosMap.get('premium')
      const magnaId = productosMap.get('magna')
      const dieselId = productosMap.get('diesel')

      let actualizados = 0
      const errores: string[] = []

      for (const reporte of result.rows) {
        try {
          // Obtener productos actuales del reporte
          const productosActuales = await obtenerProductosReporte(reporte.id)

          // Generar valor aleatorio de aceites a nivel de reporte (en pesos)
          const aceites = Math.round((Math.random() * 1000 + 100) * 100) / 100 // 100-1100 pesos

          // Generar valores aleatorios para cada producto (sin aceites)
          const generarValores = (importe: number) => {
            const iib = Math.random() * 5000 + 1000 // 1000-6000
            const compras = Math.random() * 3000 + 500 // 500-3500
            const cct = compras + (Math.random() * 200 - 100) // CCT cerca de compras
            const vDsc = Math.random() * 100 + 10 // 10-110
            const dc = cct - compras // DC = CCT - C
            const difVDsc = dc - vDsc // Dif V. Dsc = DC - V. Dsc
            const ifValue = iib + compras - importe // I.F. = I.I.B. + C - V
            const iffb = ifValue + (Math.random() * 50 - 25) // I.F.F.B. cerca de I.F.

            return {
              iib: Math.round(iib * 100) / 100,
              compras: Math.round(compras * 100) / 100,
              cct: Math.round(cct * 100) / 100,
              vDsc: Math.round(vDsc * 100) / 100,
              dc: Math.round(dc * 100) / 100,
              difVDsc: Math.round(difVDsc * 100) / 100,
              if: Math.round(ifValue * 100) / 100,
              iffb: Math.round(iffb * 100) / 100,
            }
          }

          const premiumValores = generarValores(productosActuales.premium?.importe || 0)
          const magnaValores = generarValores(productosActuales.magna?.importe || 0)
          const dieselValores = generarValores(productosActuales.diesel?.importe || 0)

          // Actualizar aceites en reportes
          await pool.query(
            `UPDATE reportes SET aceites = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [aceites, reporte.id]
          )

          // Actualizar productos en reporte_productos
          if (premiumId && productosActuales.premium) {
            await pool.query(
              `
              UPDATE reporte_productos
              SET iib = $1, compras = $2, cct = $3, v_dsc = $4, dc = $5, dif_v_dsc = $6, if = $7, iffb = $8, updated_at = CURRENT_TIMESTAMP
              WHERE reporte_id = $9 AND producto_id = $10
              `,
              [
                premiumValores.iib,
                premiumValores.compras,
                premiumValores.cct,
                premiumValores.vDsc,
                premiumValores.dc,
                premiumValores.difVDsc,
                premiumValores.if,
                premiumValores.iffb,
                reporte.id,
                premiumId,
              ]
            )
          }

          if (magnaId && productosActuales.magna) {
            await pool.query(
              `
              UPDATE reporte_productos
              SET iib = $1, compras = $2, cct = $3, v_dsc = $4, dc = $5, dif_v_dsc = $6, if = $7, iffb = $8, updated_at = CURRENT_TIMESTAMP
              WHERE reporte_id = $9 AND producto_id = $10
              `,
              [
                magnaValores.iib,
                magnaValores.compras,
                magnaValores.cct,
                magnaValores.vDsc,
                magnaValores.dc,
                magnaValores.difVDsc,
                magnaValores.if,
                magnaValores.iffb,
                reporte.id,
                magnaId,
              ]
            )
          }

          if (dieselId && productosActuales.diesel) {
            await pool.query(
              `
              UPDATE reporte_productos
              SET iib = $1, compras = $2, cct = $3, v_dsc = $4, dc = $5, dif_v_dsc = $6, if = $7, iffb = $8, updated_at = CURRENT_TIMESTAMP
              WHERE reporte_id = $9 AND producto_id = $10
              `,
              [
                dieselValores.iib,
                dieselValores.compras,
                dieselValores.cct,
                dieselValores.vDsc,
                dieselValores.dc,
                dieselValores.difVDsc,
                dieselValores.if,
                dieselValores.iffb,
                reporte.id,
                dieselId,
              ]
            )
          }

          actualizados++
        } catch (error: any) {
          errores.push(`Error al actualizar reporte ${reporte.id}: ${error.message}`)
        }
      }

      res.json({
        message: `Actualización completada. ${actualizados} reportes actualizados.`,
        actualizados,
        total: result.rows.length,
        errores: errores.length > 0 ? errores : undefined,
      })
    } catch (error) {
      console.error('Error al actualizar reportes con valores aleatorios:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getAuditoriaReporte(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { id } = req.params

      // Verificar que el reporte existe
      const reporteCheck = await pool.query('SELECT id FROM reportes WHERE id = $1', [id])
      if (reporteCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Reporte no encontrado' })
      }

      // Obtener auditoría del reporte
      const result = await pool.query(
        `
        SELECT 
          id,
          reporte_id,
          usuario_id,
          usuario_nombre,
          accion,
          campo_modificado,
          valor_anterior,
          valor_nuevo,
          descripcion,
          fecha_cambio,
          fecha_reporte
        FROM reportes_auditoria
        WHERE reporte_id = $1
        ORDER BY fecha_cambio DESC
        `,
        [id]
      )

      const auditoria = result.rows.map((row) => ({
        id: row.id,
        reporteId: row.reporte_id,
        usuarioId: row.usuario_id,
        usuarioNombre: row.usuario_nombre,
        accion: row.accion,
        campoModificado: row.campo_modificado,
        valorAnterior: row.valor_anterior,
        valorNuevo: row.valor_nuevo,
        descripcion: row.descripcion,
        fechaCambio: row.fecha_cambio,
        fechaReporte: row.fecha_reporte,
      }))

      res.json(auditoria)
    } catch (error) {
      console.error('Error al obtener auditoría:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getAllLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo Administrador puede ver todos los logs
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No autorizado' })
      }

      // Parámetros de paginación
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const offset = (page - 1) * limit

      // Filtros
      const accionFiltro = req.query.accion as string | undefined
      const usuarioFiltro = req.query.usuario as string | undefined
      const fechaDesde = req.query.fechaDesde as string | undefined
      const fechaHasta = req.query.fechaHasta as string | undefined
      const busqueda = req.query.busqueda as string | undefined

      // Query base
      let whereClause = 'WHERE 1=1'
      const params: any[] = []
      let paramCount = 1

      // Aplicar filtros
      if (accionFiltro) {
        whereClause += ` AND accion = $${paramCount}`
        params.push(accionFiltro)
        paramCount++
      }

      if (usuarioFiltro) {
        whereClause += ` AND usuario_nombre ILIKE $${paramCount}`
        params.push(`%${usuarioFiltro}%`)
        paramCount++
      }

      if (fechaDesde) {
        whereClause += ` AND fecha_cambio >= $${paramCount}`
        params.push(fechaDesde)
        paramCount++
      }

      if (fechaHasta) {
        whereClause += ` AND fecha_cambio <= $${paramCount}`
        params.push(fechaHasta + ' 23:59:59')
        paramCount++
      }

      if (busqueda) {
        whereClause += ` AND (
          usuario_nombre ILIKE $${paramCount} OR
          accion ILIKE $${paramCount} OR
          campo_modificado ILIKE $${paramCount} OR
          descripcion ILIKE $${paramCount} OR
          reporte_id::text ILIKE $${paramCount}
        )`
        params.push(`%${busqueda}%`)
        paramCount++
      }

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reportes_auditoria
        ${whereClause}
      `

      // Query para obtener datos
      const dataQuery = `
        SELECT 
          a.id,
          a.reporte_id,
          a.usuario_id,
          a.usuario_nombre,
          a.accion,
          a.campo_modificado,
          a.valor_anterior,
          a.valor_nuevo,
          a.descripcion,
          a.fecha_cambio,
          a.fecha_reporte,
          r.estacion_id,
          e.nombre as estacion_nombre
        FROM reportes_auditoria a
        LEFT JOIN reportes r ON a.reporte_id = r.id
        LEFT JOIN estaciones e ON r.estacion_id = e.id
        ${whereClause}
        ORDER BY a.fecha_cambio DESC
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

      const logs = dataResult.rows.map((row) => ({
        id: row.id,
        reporteId: row.reporte_id,
        usuarioId: row.usuario_id,
        usuarioNombre: row.usuario_nombre,
        accion: row.accion,
        campoModificado: row.campo_modificado,
        valorAnterior: row.valor_anterior,
        valorNuevo: row.valor_nuevo,
        descripcion: row.descripcion,
        fechaCambio: row.fecha_cambio,
        fechaReporte: row.fecha_reporte,
        estacionId: row.estacion_id,
        estacionNombre: row.estacion_nombre,
      }))

      res.json({
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      })
    } catch (error) {
      console.error('Error al obtener logs:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },

  async getLogsSistema(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo Administrador puede ver todos los logs
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No autorizado' })
      }

      // Parámetros de paginación
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      // Filtros
      const filtros = {
        entidadTipo: req.query.entidadTipo as string | undefined,
        usuarioId: req.query.usuarioId as string | undefined,
        accion: req.query.accion as string | undefined,
        fechaDesde: req.query.fechaDesde as string | undefined,
        fechaHasta: req.query.fechaHasta as string | undefined,
        busqueda: req.query.busqueda as string | undefined,
      }

      const result = await obtenerLogsAuditoria(page, limit, filtros)

      res.json(result)
    } catch (error) {
      console.error('Error al obtener logs del sistema:', error)
      res.status(500).json({ message: 'Error interno del servidor' })
    }
  },
}

