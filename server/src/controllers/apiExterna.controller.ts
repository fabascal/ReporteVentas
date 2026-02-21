import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { apiExternaService } from '../services/apiExterna.service.js'
import { pool } from '../config/database.js'

async function estaPeriodoOperativoCerrado(zonaId: string, fecha: string): Promise<boolean> {
  const result = await pool.query(
    `
    SELECT 1
    FROM zonas_periodos_cierre
    WHERE zona_id = $1
      AND anio = EXTRACT(YEAR FROM $2::date)::int
      AND mes = EXTRACT(MONTH FROM $2::date)::int
      AND esta_cerrado = true
    LIMIT 1
    `,
    [zonaId, fecha]
  )

  return result.rows.length > 0
}

export const apiExternaController = {
  async sincronizarReportes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden sincronizar
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para sincronizar reportes' })
      }

      const { fechaInicio, fechaFin } = req.body

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Las fechas de inicio y fin son requeridas' })
      }

      // Validar formato de fecha (YYYY-MM-DD)
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!fechaRegex.test(fechaInicio) || !fechaRegex.test(fechaFin)) {
        return res.status(400).json({ message: 'El formato de fecha debe ser YYYY-MM-DD' })
      }

      const resultado = await apiExternaService.sincronizarDatos(
        fechaInicio,
        fechaFin,
        req.user.id
      )

      res.json({
        message: 'Sincronización completada',
        resultado,
      })
    } catch (error: any) {
      console.error('Error al sincronizar reportes:', error)
      res.status(500).json({
        message: error.message || 'Error interno del servidor al sincronizar reportes',
      })
    }
  },

  async probarConexion(req: AuthRequest, res: Response) {
    try {
      console.log('=== Iniciando prueba de conexión ===')
      
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden probar la conexión
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para probar la conexión' })
      }

      const { usuario, contrasena } = req.body

      console.log('Intentando probar conexión con usuario:', usuario)

      if (!usuario || !contrasena) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos' })
      }

      console.log('Llamando a apiExternaService.obtenerToken...')
      const token = await apiExternaService.obtenerToken(usuario, contrasena)
      console.log('Token obtenido exitosamente')

      res.json({
        success: true,
        message: 'Conexión exitosa',
        token: token.substring(0, 20) + '...', // Solo mostrar parte del token por seguridad
      })
    } catch (error: any) {
      console.error('=== Error al probar conexión ===')
      console.error('Error completo:', error)
      console.error('Tipo de error:', typeof error)
      console.error('Nombre del error:', error?.name)
      console.error('Mensaje del error:', error?.message)
      console.error('Stack trace:', error?.stack)
      
      // Si el error tiene más información, loguearla
      if (error?.response) {
        console.error('Error response:', error.response.data)
        console.error('Error status:', error.response.status)
      }
      
      res.status(500).json({
        success: false,
        message: error?.message || 'Error al conectar con la API externa',
        error: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      })
    }
  },

  /**
   * Reprocesar una estación específica día por día
   */
  async reprocesarEstacion(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden reprocesar
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para reprocesar estaciones' })
      }

      const { estacionId, fechaInicio, fechaFin } = req.body

      if (!estacionId || !fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'La estación y las fechas son requeridas' })
      }

      // Validar formato de fecha (YYYY-MM-DD)
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!fechaRegex.test(fechaInicio) || !fechaRegex.test(fechaFin)) {
        return res.status(400).json({ message: 'El formato de fecha debe ser YYYY-MM-DD' })
      }

      // Verificar que la estación existe
      const estacionResult = await pool.query(
        'SELECT id, nombre, identificador_externo, zona_id FROM estaciones WHERE id = $1',
        [estacionId]
      )

      if (estacionResult.rows.length === 0) {
        return res.status(404).json({ message: 'Estación no encontrada' })
      }

      const estacion = estacionResult.rows[0]

      if (!estacion.identificador_externo) {
        return res.status(400).json({ 
          message: 'La estación no tiene identificador externo configurado' 
        })
      }

      console.log(`\n========== REPROCESANDO ESTACIÓN ==========`)
      console.log(`Estación: ${estacion.nombre} (${estacion.identificador_externo})`)
      console.log(`Rango: ${fechaInicio} a ${fechaFin}`)
      console.log(`Usuario: ${req.user.name || req.user.id}`)

      // Obtener credenciales de la API
      const usuarioResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_usuario']
      )
      const contrasenaResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_contrasena']
      )

      if (usuarioResult.rows.length === 0 || contrasenaResult.rows.length === 0) {
        return res.status(500).json({ 
          message: 'Las credenciales de la API externa no están configuradas' 
        })
      }

      const api_usuario = usuarioResult.rows[0].valor
      const api_contrasena = contrasenaResult.rows[0].valor

      // Obtener token
      const token = await apiExternaService.obtenerToken(api_usuario, api_contrasena)
      console.log('Token obtenido exitosamente')

      // Procesar día por día
      const fechaInicioDt = new Date(fechaInicio + 'T00:00:00')
      const fechaFinDt = new Date(fechaFin + 'T00:00:00')
      
      let creados = 0
      let actualizados = 0
      let errores = 0
      const detalles: any[] = []

      for (let fecha = new Date(fechaInicioDt); fecha <= fechaFinDt; fecha.setDate(fecha.getDate() + 1)) {
        const fechaStr = fecha.toISOString().split('T')[0]
        
        try {
          console.log(`\nProcesando fecha: ${fechaStr}`)

          const periodoOperativoCerrado = await estaPeriodoOperativoCerrado(estacion.zona_id, fechaStr)
          if (periodoOperativoCerrado) {
            console.log(`  ⛔ Período operativo cerrado. No se reprocesa este día.`)
            detalles.push({
              fecha: fechaStr,
              estado: 'bloqueado_cierre_operativo',
              mensaje: 'Período operativo cerrado para la zona',
            })
            errores++
            continue
          }

          // Obtener datos de la API para este día específico
          const datos = await apiExternaService.obtenerDatosReportes(token, fechaStr, fechaStr)
          
          // Filtrar solo los datos de esta estación
          const datosEstacion = datos.filter(item => {
            const identificador = apiExternaService.extraerIdentificadorEstacion(item.Estación)
            return identificador === estacion.identificador_externo
          })

          if (datosEstacion.length === 0) {
            console.log(`  ⚠️  No hay datos para esta fecha`)
            detalles.push({
              fecha: fechaStr,
              estado: 'sin_datos',
              mensaje: 'No hay datos en la API externa para esta fecha'
            })
            continue
          }

          // Mapear los datos
          const reportesMapeados = await apiExternaService.mapearDatosAReportes(datosEstacion)
          const datosReporte = Array.from(reportesMapeados.values())[0]

          if (!datosReporte) {
            console.log(`  ⚠️  No se pudo mapear el reporte`)
            detalles.push({
              fecha: fechaStr,
              estado: 'error_mapeo',
              mensaje: 'Error al mapear los datos'
            })
            errores++
            continue
          }

          // Verificar si ya existe un reporte para esta fecha
          const reporteExistente = await pool.query(
            'SELECT id, aceites FROM reportes WHERE estacion_id = $1 AND fecha::date = $2::date',
            [estacionId, fechaStr]
          )

          // Si existe un reporte, obtener sus valores de inventario actuales para preservarlos
          let inventarioExistente = {
            premium: { iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 },
            magna: { iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 },
            diesel: { iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0, if: 0, iffb: 0 },
          }

          if (reporteExistente.rows.length > 0) {
            // Obtener los valores de inventario existentes
            const productosExistentes = await pool.query(
              `SELECT 
                pc.tipo_producto,
                rp.iib, rp.compras, rp.cct, rp.v_dsc, rp.dc, rp.dif_v_dsc, rp.if, rp.iffb
               FROM reporte_productos rp
               INNER JOIN productos_catalogo pc ON pc.id = rp.producto_id
               WHERE rp.reporte_id = $1`,
              [reporteExistente.rows[0].id]
            )

            productosExistentes.rows.forEach((row) => {
              const tipo = row.tipo_producto.toLowerCase()
              inventarioExistente[tipo as 'premium' | 'magna' | 'diesel'] = {
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
          }

          // Preparar productos (usando directamente los valores de la API)
          const productosParaGuardar = {
            premium: {
              precio: datosReporte.premium.precio,
              litros: datosReporte.premium.litros,
              importe: datosReporte.premium.importe || 0,
              adminVolumen: datosReporte.premium.adminVolumen || 0,
              adminImporte: datosReporte.premium.adminImporte || 0,
              mermaVolumen: datosReporte.premium.mermaVolumen || 0,
              mermaImporte: datosReporte.premium.mermaImporte || 0,
              mermaPorcentaje: datosReporte.premium.mermaPorcentaje || 0,
              iib: datosReporte.premium.iib || 0,
              compras: datosReporte.premium.compras || 0,
              cct: datosReporte.premium.cct || 0,
              vDsc: inventarioExistente.premium.vDsc,
              dc: inventarioExistente.premium.dc,
              difVDsc: inventarioExistente.premium.difVDsc,
              if: inventarioExistente.premium.if,
              iffb: datosReporte.premium.iffb || 0,
            },
            magna: {
              precio: datosReporte.magna.precio,
              litros: datosReporte.magna.litros,
              importe: datosReporte.magna.importe || 0,
              adminVolumen: datosReporte.magna.adminVolumen || 0,
              adminImporte: datosReporte.magna.adminImporte || 0,
              mermaVolumen: datosReporte.magna.mermaVolumen || 0,
              mermaImporte: datosReporte.magna.mermaImporte || 0,
              mermaPorcentaje: datosReporte.magna.mermaPorcentaje || 0,
              iib: datosReporte.magna.iib || 0,
              compras: datosReporte.magna.compras || 0,
              cct: datosReporte.magna.cct || 0,
              vDsc: inventarioExistente.magna.vDsc,
              dc: inventarioExistente.magna.dc,
              difVDsc: inventarioExistente.magna.difVDsc,
              if: inventarioExistente.magna.if,
              iffb: datosReporte.magna.iffb || 0,
            },
            diesel: {
              precio: datosReporte.diesel.precio,
              litros: datosReporte.diesel.litros,
              importe: datosReporte.diesel.importe || 0,
              adminVolumen: datosReporte.diesel.adminVolumen || 0,
              adminImporte: datosReporte.diesel.adminImporte || 0,
              mermaVolumen: datosReporte.diesel.mermaVolumen || 0,
              mermaImporte: datosReporte.diesel.mermaImporte || 0,
              mermaPorcentaje: datosReporte.diesel.mermaPorcentaje || 0,
              iib: datosReporte.diesel.iib || 0,
              compras: datosReporte.diesel.compras || 0,
              cct: datosReporte.diesel.cct || 0,
              vDsc: inventarioExistente.diesel.vDsc,
              dc: inventarioExistente.diesel.dc,
              difVDsc: inventarioExistente.diesel.difVDsc,
              if: inventarioExistente.diesel.if,
              iffb: datosReporte.diesel.iffb || 0,
            },
          }

          // Función helper para guardar/actualizar productos
          const guardarProductosReporte = async (reporteId: string, productos: any, esActualizacion: boolean = false) => {
            const reporteResult = await pool.query(
              `SELECT fecha FROM reportes WHERE id = $1`,
              [reporteId]
            )
            
            if (reporteResult.rows.length === 0) {
              throw new Error(`Reporte ${reporteId} no encontrado`)
            }
            
            const fechaReporte = reporteResult.rows[0].fecha

            const productosCatalogo = await pool.query(
              `SELECT id, tipo_producto FROM productos_catalogo WHERE activo = true`
            )

            const productosMap = new Map<string, string>()
            productosCatalogo.rows.forEach((row) => {
              productosMap.set(row.tipo_producto.toLowerCase(), row.id)
            })

            if (esActualizacion) {
              await pool.query(`DELETE FROM reporte_productos WHERE reporte_id = $1`, [reporteId])
            }

            for (const [tipoProducto, datos] of Object.entries(productos) as [string, any][]) {
              const productoId = productosMap.get(tipoProducto.toLowerCase())
              if (!productoId) continue

              const precio = parseFloat(datos.precio || 0)
              const litros = parseFloat(datos.litros || 0)
              const ifVal = parseFloat(datos.if || 0)
              const iffbVal = parseFloat(datos.iffb || 0)
              
              const eficienciaReal = iffbVal - ifVal
              const eficienciaImporte = eficienciaReal * precio
              let eficienciaRealPorcentaje = litros > 0 ? (eficienciaReal / litros) * 100 : 0
              
              if (eficienciaRealPorcentaje > 9999.9999) {
                eficienciaRealPorcentaje = 9999.9999
              } else if (eficienciaRealPorcentaje < -9999.9999) {
                eficienciaRealPorcentaje = -9999.9999
              }

              await pool.query(
                `INSERT INTO reporte_productos (
                  reporte_id, producto_id, precio, litros, importe,
                  admin_volumen, admin_importe,
                  merma_volumen, merma_importe, merma_porcentaje,
                  iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb,
                  eficiencia_real, eficiencia_importe, eficiencia_real_porcentaje, fecha
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
                [
                  reporteId, productoId, precio, litros, datos.importe || 0,
                  datos.adminVolumen || 0, datos.adminImporte || 0,
                  datos.mermaVolumen || 0, datos.mermaImporte || 0, datos.mermaPorcentaje || 0,
                  datos.iib || 0, datos.compras || 0, datos.cct || 0,
                  datos.vDsc || 0, datos.dc || 0, datos.difVDsc || 0,
                  ifVal, iffbVal, eficienciaReal, eficienciaImporte, eficienciaRealPorcentaje,
                  fechaReporte,
                ]
              )
            }
          }

          if (reporteExistente.rows.length > 0) {
            // Actualizar reporte existente
            const aceitesParaGuardar = datosReporte.aceitesDetectado
              ? (datosReporte.aceites || 0)
              : (reporteExistente.rows[0].aceites || 0)
            await pool.query(
              `UPDATE reportes SET aceites = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [reporteExistente.rows[0].id, aceitesParaGuardar]
            )
            await guardarProductosReporte(reporteExistente.rows[0].id, productosParaGuardar, true)
            actualizados++
            console.log(`  ✅ ACTUALIZADO`)
            detalles.push({
              fecha: fechaStr,
              estado: 'actualizado',
              premium_litros: productosParaGuardar.premium.litros,
              magna_litros: productosParaGuardar.magna.litros,
              diesel_litros: productosParaGuardar.diesel.litros,
            })
          } else {
            // Crear nuevo reporte
            const result = await pool.query(
              `INSERT INTO reportes (estacion_id, fecha, aceites, estado, creado_por)
               VALUES ($1, $2::date, $3, $4, $5) RETURNING id`,
              [estacionId, fechaStr, datosReporte.aceites || 0, 'Pendiente', req.user.id]
            )
            await guardarProductosReporte(result.rows[0].id, productosParaGuardar, false)
            creados++
            console.log(`  ✅ CREADO`)
            detalles.push({
              fecha: fechaStr,
              estado: 'creado',
              premium_litros: productosParaGuardar.premium.litros,
              magna_litros: productosParaGuardar.magna.litros,
              diesel_litros: productosParaGuardar.diesel.litros,
            })
          }
        } catch (error: any) {
          console.error(`  ❌ ERROR: ${error.message}`)
          errores++
          detalles.push({
            fecha: fechaStr,
            estado: 'error',
            mensaje: error.message
          })
        }
      }

      console.log(`\n========== RESUMEN ==========`)
      console.log(`Creados: ${creados}`)
      console.log(`Actualizados: ${actualizados}`)
      console.log(`Errores: ${errores}`)
      console.log(`=============================\n`)

      res.json({
        success: true,
        message: 'Reprocesamiento completado',
        resultado: {
          estacion: {
            id: estacion.id,
            nombre: estacion.nombre,
            identificador_externo: estacion.identificador_externo
          },
          rango: { fechaInicio, fechaFin },
          creados,
          actualizados,
          errores,
          detalles
        }
      })
    } catch (error: any) {
      console.error('Error al reprocesar estación:', error)
      res.status(500).json({
        success: false,
        message: error.message || 'Error al reprocesar estación'
      })
    }
  },

  async sincronizarEstaciones(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      // Solo administradores pueden sincronizar estaciones
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'No tienes permiso para sincronizar estaciones' })
      }

      const { fechaInicio, fechaFin, zonaId } = req.body

      // Si no se proporciona zonaId, usar el ID por defecto
      const zonaIdFinal = zonaId || 'c983f8cc-766e-40d8-93b6-670a4b739e92'

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ message: 'Las fechas de inicio y fin son requeridas' })
      }

      // Validar formato de fecha (YYYY-MM-DD)
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!fechaRegex.test(fechaInicio) || !fechaRegex.test(fechaFin)) {
        return res.status(400).json({ message: 'El formato de fecha debe ser YYYY-MM-DD' })
      }

      console.log('=== Iniciando sincronización de estaciones ===')
      const resultado = await apiExternaService.sincronizarEstaciones(
        fechaInicio,
        fechaFin,
        zonaIdFinal
      )

      res.json({
        message: 'Sincronización de estaciones completada',
        resultado,
      })
    } catch (error: any) {
      console.error('=== Error al sincronizar estaciones ===')
      console.error('Error completo:', error)
      res.status(500).json({
        message: error.message || 'Error interno del servidor al sincronizar estaciones',
      })
    }
  },

  async obtenerDatosEstacionFecha(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      const { estacionId, fecha } = req.body

      if (!estacionId || !fecha) {
        return res.status(400).json({ message: 'El ID de estación y la fecha son requeridos' })
      }

      // Validar formato de fecha (YYYY-MM-DD)
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!fechaRegex.test(fecha)) {
        return res.status(400).json({ message: 'El formato de fecha debe ser YYYY-MM-DD' })
      }

      // Obtener identificador externo de la estación
      const estacionResult = await pool.query(
        'SELECT identificador_externo FROM estaciones WHERE id = $1',
        [estacionId]
      )

      if (estacionResult.rows.length === 0) {
        return res.status(404).json({ message: 'Estación no encontrada' })
      }

      const identificadorExterno = estacionResult.rows[0].identificador_externo

      if (!identificadorExterno) {
        return res.status(400).json({ message: 'La estación no tiene identificador externo configurado' })
      }

      const datos = await apiExternaService.obtenerDatosEstacionFecha(identificadorExterno, fecha)

      res.json(datos)
    } catch (error: any) {
      console.error('Error al obtener datos de estación y fecha:', error)
      res.status(500).json({
        message: error.message || 'Error interno del servidor',
      })
    }
  },
}

