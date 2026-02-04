import { Response } from 'express'
import * as XLSX from 'xlsx'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { pool } from '../config/database.js'

interface FilaExcel {
  fecha?: string | number
  producto?: string
  iib?: number
  compras?: number
  cct?: number
  v_dsc?: number
  iffb?: number
  aceites?: number
}

export const importExcelController = {
  async importarReportesExcel(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' })
      }

      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Solo administradores pueden importar datos' })
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' })
      }

      console.log('[IMPORT] Archivo recibido:', req.file.originalname)

      // Leer el archivo Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
      
      const resultados = {
        exitosos: 0,
        errores: 0,
        detalles: [] as any[]
      }

      // Obtener todos los productos del catálogo
      const productosResult = await pool.query(`
        SELECT id, tipo_producto, nombre_display FROM productos_catalogo WHERE activo = TRUE
      `)
      const productosMap = new Map(
        productosResult.rows.map(p => [p.tipo_producto.toLowerCase(), p.id])
      )

      // Procesar cada hoja (cada hoja = una estación)
      for (const sheetName of workbook.SheetNames) {
        console.log(`[IMPORT] Procesando hoja: ${sheetName}`)

        try {
          // Buscar la estación por identificador_externo
          const estacionResult = await pool.query(
            'SELECT id, nombre FROM estaciones WHERE identificador_externo = $1',
            [sheetName]
          )

          if (estacionResult.rows.length === 0) {
            resultados.errores++
            resultados.detalles.push({
              hoja: sheetName,
              error: 'Estación no encontrada',
              tipo: 'estacion_no_encontrada'
            })
            console.log(`[IMPORT] ERROR: Estación no encontrada para identificador: ${sheetName}`)
            continue
          }

          const estacion = estacionResult.rows[0]
          console.log(`[IMPORT] Estación encontrada: ${estacion.nombre} (${estacion.id})`)

          // Leer datos de la hoja
          const worksheet = workbook.Sheets[sheetName]
          const datos: any[] = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: null 
          })

          console.log(`[IMPORT] ${datos.length} filas encontradas en la hoja`)

          // Agrupar por fecha
          const datosPorFecha = new Map<string, FilaExcel[]>()

          for (const fila of datos) {
            // Buscar la columna de fecha (puede tener diferentes nombres)
            const fecha = fila['Fecha'] || fila['fecha'] || fila['FECHA'] || fila['Date']
            
            if (!fecha) continue

            // Normalizar fecha
            let fechaNormalizada: string
            if (typeof fecha === 'number') {
              // Excel guarda fechas como números (días desde 1900-01-01)
              const excelDate = XLSX.SSF.parse_date_code(fecha)
              fechaNormalizada = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
            } else {
              // Intentar parsear como string
              const parsedDate = new Date(fecha)
              if (isNaN(parsedDate.getTime())) continue
              fechaNormalizada = parsedDate.toISOString().split('T')[0]
            }

            if (!datosPorFecha.has(fechaNormalizada)) {
              datosPorFecha.set(fechaNormalizada, [])
            }

            // Identificar el producto
            const producto = fila['Producto'] || fila['producto'] || fila['PRODUCTO'] || ''
            
            // Helper para limpiar y parsear números (eliminar comas de separador de miles)
            const parsearNumero = (valor: any): number | undefined => {
              if (!valor) return undefined
              const valorStr = String(valor).replace(/,/g, '') // Eliminar comas
              const num = parseFloat(valorStr)
              return isNaN(num) ? undefined : num
            }

            datosPorFecha.get(fechaNormalizada)!.push({
              fecha: fechaNormalizada,
              producto: producto.toLowerCase(),
              iib: parsearNumero(fila['IIB'] || fila['iib'] || fila['I.I.B.']),
              compras: parsearNumero(fila['C'] || fila['c'] || fila['Compras'] || fila['COMPRAS']),
              cct: parsearNumero(fila['CCT'] || fila['cct'] || fila['C.C.T.']),
              v_dsc: parsearNumero(fila['V.DSC'] || fila['v.dsc'] || fila['V DSC'] || fila['VDSC']),
              iffb: parsearNumero(fila['IFFB'] || fila['iffb'] || fila['I.F.F.B.']),
              aceites: parsearNumero(fila['Aceites'] || fila['aceites'] || fila['ACEITES']),
            })
          }

          console.log(`[IMPORT] ${datosPorFecha.size} fechas únicas encontradas`)

          // Actualizar reportes por fecha
          for (const [fecha, filas] of datosPorFecha.entries()) {
            console.log(`[IMPORT] Procesando fecha: ${fecha} con ${filas.length} productos`)

            // Buscar el reporte existente
            const reporteResult = await pool.query(
              'SELECT id FROM reportes WHERE estacion_id = $1 AND fecha = $2',
              [estacion.id, fecha]
            )

            if (reporteResult.rows.length === 0) {
              resultados.errores++
              resultados.detalles.push({
                hoja: sheetName,
                fecha,
                error: 'Reporte no encontrado para esta fecha',
                tipo: 'reporte_no_encontrado'
              })
              console.log(`[IMPORT] ERROR: Reporte no encontrado para ${estacion.nombre} en ${fecha}`)
              continue
            }

            const reporteId = reporteResult.rows[0].id

            // Actualizar aceites en el reporte (solo una vez, del primer producto)
            const primeraFila = filas[0]
            if (primeraFila?.aceites !== undefined) {
              await pool.query(
                'UPDATE reportes SET aceites = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [primeraFila.aceites, reporteId]
              )
              console.log(`[IMPORT] Aceites actualizado: ${primeraFila.aceites}`)
            }

            // Actualizar cada producto del reporte
            for (const fila of filas) {
              if (!fila.producto) continue

              // Mapear nombre del producto al ID
              let productoId: string | undefined
              const productoNormalizado = fila.producto.toLowerCase().trim()

              // Mapeo directo por tipo_producto
              if (productoNormalizado.includes('premium') || productoNormalizado === '1' || productoNormalizado.includes('91')) {
                productoId = productosMap.get('premium') as string | undefined
              } else if (productoNormalizado.includes('magna') || productoNormalizado === '2' || productoNormalizado.includes('87')) {
                productoId = productosMap.get('magna') as string | undefined
              } else if (productoNormalizado.includes('diesel') || productoNormalizado === '3') {
                productoId = productosMap.get('diesel') as string | undefined
              }

              if (!productoId) {
                console.log(`[IMPORT] WARN: Producto no identificado: "${fila.producto}". Use "Premium", "Magna", "Diesel" o "1", "2", "3"`)
                continue
              }

              // Actualizar reporte_productos
              const updateFields: string[] = []
              const updateValues: any[] = []
              let paramIndex = 1

              if (fila.iib !== undefined) {
                updateFields.push(`iib = $${paramIndex++}`)
                updateValues.push(fila.iib)
              }
              if (fila.compras !== undefined) {
                updateFields.push(`compras = $${paramIndex++}`)
                updateValues.push(fila.compras)
              }
              if (fila.cct !== undefined) {
                updateFields.push(`cct = $${paramIndex++}`)
                updateValues.push(fila.cct)
              }
              if (fila.v_dsc !== undefined) {
                updateFields.push(`v_dsc = $${paramIndex++}`)
                updateValues.push(fila.v_dsc)
              }
              if (fila.iffb !== undefined) {
                updateFields.push(`iffb = $${paramIndex++}`)
                updateValues.push(fila.iffb)
              }

              if (updateFields.length === 0) {
                console.log(`[IMPORT] WARN: No hay campos para actualizar en ${fila.producto}`)
                continue
              }

              updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
              updateValues.push(reporteId, productoId, fecha)

              const updateQuery = `
                UPDATE reporte_productos 
                SET ${updateFields.join(', ')}
                WHERE reporte_id = $${paramIndex++} 
                  AND producto_id = $${paramIndex++}
                  AND fecha = $${paramIndex}
              `

              await pool.query(updateQuery, updateValues)

              console.log(`[IMPORT] Actualizado: ${estacion.nombre} - ${fecha} - ${fila.producto}`)
            }

            resultados.exitosos++
            resultados.detalles.push({
              hoja: sheetName,
              estacion: estacion.nombre,
              fecha,
              productos: filas.length,
              mensaje: 'Importado exitosamente'
            })
          }

        } catch (error) {
          console.error(`[IMPORT] Error procesando hoja ${sheetName}:`, error)
          resultados.errores++
          resultados.detalles.push({
            hoja: sheetName,
            error: error instanceof Error ? error.message : 'Error desconocido',
            tipo: 'error_procesamiento'
          })
        }
      }

      console.log('[IMPORT] Proceso completado:', resultados)

      res.json({
        success: true,
        message: `Importación completada: ${resultados.exitosos} exitosos, ${resultados.errores} errores`,
        ...resultados
      })

    } catch (error) {
      console.error('[IMPORT] Error general:', error)
      res.status(500).json({ 
        success: false,
        message: 'Error al procesar el archivo Excel',
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }
}
