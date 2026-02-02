import { pool } from '../config/database.js'
import axios, { AxiosError } from 'axios'

const API_BASE_URL = 'https://combuapiv2.nexusfuel.com/ReportST'

// Verificar que axios esté disponible
if (!axios) {
  console.error('❌ Axios no está disponible')
}

interface TokenResponse {
  Error: boolean
  Data: string
  Comment: string
}

interface ScrapDataItem {
  Estación: string
  Producto: string
  Volumen: string
  Importe: string
  'Volumen Admin': string
  'Importe Admin': string
  'Volumen Merma': string
  'Importe Merma': string
  Merma: string
}

interface ScrapResponse {
  Error: boolean
  Data: ScrapDataItem[]
  Comment: string | null
}

export class ApiExternaService {
  /**
   * Obtiene el token de la API externa
   */
  async obtenerToken(usuario: string, contrasena: string): Promise<string> {
    try {
      const url = `${API_BASE_URL}/GetExternalToken?usuario=${encodeURIComponent(usuario)}&constrasena=${encodeURIComponent(contrasena)}`
      
      console.log('Llamando a la API externa (POST):', url.replace(contrasena, '***'))
      
      // La API requiere método POST según el ejemplo de Postman
      const response = await axios.post<TokenResponse>(url, '', {
        timeout: 30000, // 30 segundos de timeout
        headers: {},
        maxBodyLength: Infinity,
      })
      
      console.log('Respuesta recibida, status:', response.status)
      console.log('Respuesta data:', JSON.stringify(response.data))
      
      const data = response.data

      if (data.Error) {
        throw new Error('Error en la respuesta de la API: ' + (data.Comment || 'Error desconocido'))
      }

      if (!data.Data) {
        throw new Error('No se recibió token de la API')
      }

      return data.Data
    } catch (error: any) {
      console.error('Error al obtener token:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      })
      
      if (error.response) {
        const status = error.response.status
        const statusText = error.response.statusText
        const data = error.response.data
        console.error('Response data:', JSON.stringify(data))
        throw new Error(`Error HTTP ${status}: ${statusText}${data ? ' - ' + JSON.stringify(data) : ''}`)
      } else if (error.request) {
        throw new Error('No se pudo conectar con la API externa. Verifica tu conexión a internet.')
      } else {
        throw new Error(error.message || 'Error al obtener token')
      }
    }
  }

  /**
   * Obtiene los datos de reportes de la API externa
   */
  async obtenerDatosReportes(token: string, fechaInicio: string, fechaFin: string): Promise<ScrapDataItem[]> {
    try {
      const url = `${API_BASE_URL}/GetScrapByDate?token=${encodeURIComponent(token)}&dateIni=${encodeURIComponent(fechaInicio)}&dateEnd=${encodeURIComponent(fechaFin)}`
      
      console.log('Llamando a GetScrapByDate (POST):', url.replace(token, 'TOKEN***'))
      
      // La API también requiere método POST
      const response = await axios.post<ScrapResponse>(url, '', {
        timeout: 30000,
        headers: {},
        maxBodyLength: Infinity,
      })
      
      console.log('Respuesta recibida, status:', response.status)
      
      const data = response.data

      if (data.Error) {
        throw new Error('Error en la respuesta de la API: ' + (data.Comment || 'Error desconocido'))
      }

      if (!data.Data || !Array.isArray(data.Data)) {
        throw new Error('No se recibieron datos válidos de la API')
      }

      return data.Data
    } catch (error: any) {
      console.error('Error al obtener datos de reportes:', error)
      if (error.response) {
        const status = error.response.status
        const statusText = error.response.statusText
        const data = error.response.data
        throw new Error(`Error HTTP ${status}: ${statusText}${data ? ' - ' + JSON.stringify(data) : ''}`)
      } else if (error.request) {
        throw new Error('No se pudo conectar con la API externa')
      } else {
        throw new Error(error.message || 'Error al obtener datos de reportes')
      }
    }
  }

  /**
   * Extrae el identificador de estación del formato "998: EUREKA"
   */
  extraerIdentificadorEstacion(estacionString: string): string | null {
    const match = estacionString.match(/^(\d+):/)
    return match ? match[1] : null
  }

  /**
   * Obtiene datos de ventas y mermas de la API externa para una estación y fecha específica
   */
  async obtenerDatosEstacionFecha(identificadorExterno: string, fecha: string): Promise<{
    premium?: { precio: number; litros: number; importe: number; mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
    magna?: { precio: number; litros: number; importe: number; mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
    diesel?: { precio: number; litros: number; importe: number; mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
  }> {
    try {
      // Obtener configuración de API (usando la misma lógica que sincronizarDatos)
      const usuarioResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_usuario']
      )
      const contrasenaResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_contrasena']
      )

      if (usuarioResult.rows.length === 0 || contrasenaResult.rows.length === 0) {
        throw new Error('No se encontraron las credenciales de la API en la configuración')
      }

      const api_usuario = usuarioResult.rows[0].valor
      const api_contrasena = contrasenaResult.rows[0].valor

      if (!api_usuario || !api_contrasena) {
        throw new Error('Las credenciales de la API no están configuradas correctamente')
      }

      // Obtener token
      const token = await this.obtenerToken(api_usuario, api_contrasena)

      // Obtener datos de la API para la fecha específica
      const datos = await this.obtenerDatosReportes(token, fecha, fecha)

      console.log(`[obtenerDatosEstacionFecha] Total de registros obtenidos de la API: ${datos.length}`)
      console.log(`[obtenerDatosEstacionFecha] Buscando estación con identificador: ${identificadorExterno}`)

      // Filtrar por estación
      const datosEstacion = datos.filter((item) => {
        const identificador = this.extraerIdentificadorEstacion(item.Estación)
        const coincide = identificador === identificadorExterno
        if (coincide) {
          console.log(`[obtenerDatosEstacionFecha] Encontrado registro para estación ${identificador}:`, item)
        }
        return coincide
      })

      console.log(`[obtenerDatosEstacionFecha] Registros encontrados para la estación: ${datosEstacion.length}`)

      if (datosEstacion.length === 0) {
        console.log(`[obtenerDatosEstacionFecha] No se encontraron datos para la estación ${identificadorExterno} en la fecha ${fecha}`)
        return {}
      }

      // Mapear datos usando el mismo método que sincronizarDatos
      const reportesMap = await this.mapearDatosAReportes(datosEstacion)
      
      console.log(`[obtenerDatosEstacionFecha] Reportes mapeados: ${reportesMap.size}`)
      
      // Obtener el primer (y único) reporte del mapa
      const reporte = Array.from(reportesMap.values())[0]
      
      if (!reporte) {
        console.log(`[obtenerDatosEstacionFecha] No se pudo mapear el reporte`)
        return {}
      }

      console.log(`[obtenerDatosEstacionFecha] Datos mapeados:`, {
        premium: { litros: reporte.premium.litros, precio: reporte.premium.precio, mermaVolumen: reporte.premium.mermaVolumen },
        magna: { litros: reporte.magna.litros, precio: reporte.magna.precio, mermaVolumen: reporte.magna.mermaVolumen },
        diesel: { litros: reporte.diesel.litros, precio: reporte.diesel.precio, mermaVolumen: reporte.diesel.mermaVolumen },
      })

      return {
        premium: reporte.premium.litros > 0 ? {
          precio: reporte.premium.precio,
          litros: reporte.premium.litros,
          importe: reporte.premium.importe,
          mermaVolumen: reporte.premium.mermaVolumen,
          mermaImporte: reporte.premium.mermaImporte,
          mermaPorcentaje: reporte.premium.mermaPorcentaje,
        } : undefined,
        magna: reporte.magna.litros > 0 ? {
          precio: reporte.magna.precio,
          litros: reporte.magna.litros,
          importe: reporte.magna.importe,
          mermaVolumen: reporte.magna.mermaVolumen,
          mermaImporte: reporte.magna.mermaImporte,
          mermaPorcentaje: reporte.magna.mermaPorcentaje,
        } : undefined,
        diesel: reporte.diesel.litros > 0 ? {
          precio: reporte.diesel.precio,
          litros: reporte.diesel.litros,
          importe: reporte.diesel.importe,
          mermaVolumen: reporte.diesel.mermaVolumen,
          mermaImporte: reporte.diesel.mermaImporte,
          mermaPorcentaje: reporte.diesel.mermaPorcentaje,
        } : undefined,
      }
    } catch (error) {
      console.error('Error al obtener datos de estación y fecha:', error)
      throw error
    }
  }

  /**
   * Extrae el nombre de estación del formato "998: EUREKA"
   */
  extraerNombreEstacion(estacionString: string): string {
    const match = estacionString.match(/^\d+:\s*(.+)$/)
    return match ? match[1].trim() : estacionString
  }

  /**
   * Sincroniza las estaciones desde la API externa
   * Extrae las estaciones únicas de los datos y las crea/actualiza en la base de datos
   */
  async sincronizarEstaciones(fechaInicio: string, fechaFin: string, zonaId: string): Promise<{
    creadas: number
    actualizadas: number
    errores: number
    estaciones: Array<{ identificadorExterno: string; nombre: string }>
  }> {
    try {
      // Obtener credenciales de la base de datos
      const usuarioResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_usuario']
      )
      const contrasenaResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_contrasena']
      )

      if (usuarioResult.rows.length === 0 || contrasenaResult.rows.length === 0) {
        throw new Error('No se encontraron las credenciales de la API en la configuración')
      }

      const usuario = usuarioResult.rows[0].valor
      const contrasena = contrasenaResult.rows[0].valor

      if (!usuario || !contrasena) {
        throw new Error('Las credenciales de la API no están configuradas correctamente')
      }

      // Obtener token
      const token = await this.obtenerToken(usuario, contrasena)

      // Obtener datos
      const datos = await this.obtenerDatosReportes(token, fechaInicio, fechaFin)

      // Extraer estaciones únicas
      const estacionesMap = new Map<string, { identificadorExterno: string; nombre: string }>()

      datos.forEach((item) => {
        const identificador = this.extraerIdentificadorEstacion(item.Estación)
        if (identificador) {
          const nombre = this.extraerNombreEstacion(item.Estación)
          if (!estacionesMap.has(identificador)) {
            estacionesMap.set(identificador, {
              identificadorExterno: identificador,
              nombre: nombre,
            })
          }
        }
      })

      const estaciones = Array.from(estacionesMap.values())
      console.log(`Se encontraron ${estaciones.length} estaciones únicas`)

      // Verificar que la zona existe, si no, buscar la primera disponible
      let zonaIdFinal = zonaId
      const zonaCheck = await pool.query('SELECT id FROM zonas WHERE id = $1', [zonaId])
      
      if (zonaCheck.rows.length === 0) {
        console.warn(`La zona con ID ${zonaId} no existe. Buscando zona por defecto...`)
        const zonaDefault = await pool.query('SELECT id FROM zonas LIMIT 1')
        
        if (zonaDefault.rows.length === 0) {
          // Si no hay ninguna zona, crear una por defecto
          console.warn('No existen zonas en la base de datos. Creando zona por defecto "General"...')
          const nuevaZona = await pool.query(
            'INSERT INTO zonas (nombre, activa) VALUES ($1, $2) RETURNING id',
            ['General', true]
          )
          zonaIdFinal = nuevaZona.rows[0].id
        } else {
          zonaIdFinal = zonaDefault.rows[0].id
          console.log(`Usando zona por defecto con ID: ${zonaIdFinal}`)
        }
      }

      let creadas = 0
      let actualizadas = 0
      let errores = 0

      // Procesar cada estación
      for (const estacion of estaciones) {
        try {
          // Intentar actualizar estación existente usando identificador_externo como clave
          const updateResult = await pool.query(
            'UPDATE estaciones SET nombre = $1 WHERE identificador_externo = $2 RETURNING id',
            [estacion.nombre, estacion.identificadorExterno]
          )

          if (updateResult.rows.length > 0) {
            // Se actualizó una estación existente
            actualizadas++
            console.log(`Actualizada estación: ${estacion.nombre} (${estacion.identificadorExterno}) - zona preservada`)
          } else {
            // No existe estación con ese identificador_externo, crear nueva
            // Primero verificar si hay una estación con el mismo nombre pero sin identificador_externo
            const estacionPorNombre = await pool.query(
              'SELECT id FROM estaciones WHERE nombre = $1 AND (identificador_externo IS NULL OR identificador_externo = $2)',
              [estacion.nombre, estacion.identificadorExterno]
            )

            if (estacionPorNombre.rows.length > 0) {
              // Actualizar la estación existente agregando el identificador_externo
              await pool.query(
                'UPDATE estaciones SET identificador_externo = $1 WHERE id = $2',
                [estacion.identificadorExterno, estacionPorNombre.rows[0].id]
              )
              actualizadas++
              console.log(`Actualizada estación existente con identificador: ${estacion.nombre} (${estacion.identificadorExterno})`)
            } else {
              // Crear nueva estación
              await pool.query(
                'INSERT INTO estaciones (nombre, zona_id, identificador_externo, activa) VALUES ($1, $2, $3, $4)',
                [estacion.nombre, zonaIdFinal, estacion.identificadorExterno, true]
              )
              creadas++
              console.log(`Creada estación: ${estacion.nombre} (${estacion.identificadorExterno})`)
            }
          }
        } catch (error) {
          console.error(`Error al procesar estación ${estacion.identificadorExterno}:`, error)
          errores++
        }
      }

      return {
        creadas,
        actualizadas,
        errores,
        estaciones,
      }
    } catch (error) {
      console.error('Error al sincronizar estaciones:', error)
      throw error
    }
  }

  /**
   * Obtiene el catálogo de productos desde la base de datos
   */
  async obtenerCatalogoProductos(): Promise<Map<string, { tipo: string; nombreDisplay: string }>> {
    const result = await pool.query(
      'SELECT nombre_api, tipo_producto, nombre_display FROM productos_catalogo WHERE activo = true'
    )
    const catalogo = new Map<string, { tipo: string; nombreDisplay: string }>()
    result.rows.forEach((row) => {
      catalogo.set(row.nombre_api.toLowerCase(), {
        tipo: row.tipo_producto,
        nombreDisplay: row.nombre_display,
      })
    })
    return catalogo
  }

  /**
   * Mapea los datos de la API externa al formato de reportes interno usando el catálogo de productos
   */
  async mapearDatosAReportes(datos: ScrapDataItem[]): Promise<Map<string, any>> {
    // Obtener catálogo de productos
    const catalogo = await this.obtenerCatalogoProductos()

    // Agrupar por estación
    const reportesPorEstacion = new Map<string, any>()

    datos.forEach((item) => {
      const identificador = this.extraerIdentificadorEstacion(item.Estación)
      if (!identificador) {
        console.warn(`No se pudo extraer identificador de: ${item.Estación}`)
        return
      }

      if (!reportesPorEstacion.has(identificador)) {
        reportesPorEstacion.set(identificador, {
          identificadorExterno: identificador,
          nombreEstacion: this.extraerNombreEstacion(item.Estación),
          fecha: null, // Se debe proporcionar desde fuera
          premium: { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, mermaPorcentajePonderado: 0, volumenTotalParaMerma: 0 },
          magna: { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, mermaPorcentajePonderado: 0, volumenTotalParaMerma: 0 },
          diesel: { precio: 0, litros: 0, importe: 0, mermaVolumen: 0, mermaImporte: 0, mermaPorcentaje: 0, mermaPorcentajePonderado: 0, volumenTotalParaMerma: 0 },
        })
      }

      const reporte = reportesPorEstacion.get(identificador)!

      // Buscar producto en catálogo
      const productoApi = item.Producto.trim()
      const productoKey = productoApi.toLowerCase()
      const productoCatalogo = catalogo.get(productoKey)

      if (!productoCatalogo) {
        console.warn(`Producto no encontrado en catálogo: ${productoApi}`)
        return
      }

      // Mapear productos y sumar si hay múltiples registros del mismo producto
      const volumen = parseFloat(item.Volumen) || 0
      const importe = parseFloat(item.Importe) || 0
      const volumenMerma = parseFloat(item['Volumen Merma'] || '0') || 0
      const importeMerma = parseFloat(item['Importe Merma'] || '0') || 0
      // El porcentaje viene como decimal (ej: 0.025478 = 2.5478%), lo convertimos a porcentaje
      const mermaPorcentaje = parseFloat(item.Merma || '0') * 100 || 0
      const precioUnitario = volumen > 0 ? importe / volumen : 0

      // Determinar el tipo de producto según el catálogo
      const tipoProducto = productoCatalogo.tipo

      if (tipoProducto === 'premium') {
        if (reporte.premium.litros > 0) {
          const totalLitros = reporte.premium.litros + volumen
          const totalImporte = reporte.premium.importe + importe
          reporte.premium.precio = totalLitros > 0 ? totalImporte / totalLitros : 0
          reporte.premium.litros = totalLitros
          reporte.premium.importe = totalImporte
          reporte.premium.mermaVolumen = reporte.premium.mermaVolumen + volumenMerma
          reporte.premium.mermaImporte = reporte.premium.mermaImporte + importeMerma
          // Calcular promedio ponderado del porcentaje de merma basado en el volumen
          const volumenAnterior = reporte.premium.litros - volumen
          const volumenTotal = volumenAnterior + volumen
          const porcentajeAnterior = reporte.premium.mermaPorcentaje
          // Promedio ponderado: (porcentaje1 * volumen1 + porcentaje2 * volumen2) / (volumen1 + volumen2)
          reporte.premium.mermaPorcentaje = volumenTotal > 0
            ? ((porcentajeAnterior * volumenAnterior) + (mermaPorcentaje * volumen)) / volumenTotal
            : mermaPorcentaje
        } else {
          reporte.premium.precio = precioUnitario
          reporte.premium.litros = volumen
          reporte.premium.importe = importe
          reporte.premium.mermaVolumen = volumenMerma
          reporte.premium.mermaImporte = importeMerma
          // Usar el porcentaje que viene de la API directamente
          reporte.premium.mermaPorcentaje = mermaPorcentaje
        }
      } else if (tipoProducto === 'magna') {
        if (reporte.magna.litros > 0) {
          const totalLitros = reporte.magna.litros + volumen
          const totalImporte = reporte.magna.importe + importe
          reporte.magna.precio = totalLitros > 0 ? totalImporte / totalLitros : 0
          reporte.magna.litros = totalLitros
          reporte.magna.importe = totalImporte
          reporte.magna.mermaVolumen = reporte.magna.mermaVolumen + volumenMerma
          reporte.magna.mermaImporte = reporte.magna.mermaImporte + importeMerma
          // Calcular promedio ponderado del porcentaje de merma basado en el volumen
          const volumenAnterior = reporte.magna.litros - volumen
          const volumenTotal = volumenAnterior + volumen
          const porcentajeAnterior = reporte.magna.mermaPorcentaje
          // Promedio ponderado: (porcentaje1 * volumen1 + porcentaje2 * volumen2) / (volumen1 + volumen2)
          reporte.magna.mermaPorcentaje = volumenTotal > 0
            ? ((porcentajeAnterior * volumenAnterior) + (mermaPorcentaje * volumen)) / volumenTotal
            : mermaPorcentaje
        } else {
          reporte.magna.precio = precioUnitario
          reporte.magna.litros = volumen
          reporte.magna.importe = importe
          reporte.magna.mermaVolumen = volumenMerma
          reporte.magna.mermaImporte = importeMerma
          // Usar el porcentaje que viene de la API directamente
          reporte.magna.mermaPorcentaje = mermaPorcentaje
        }
      } else if (tipoProducto === 'diesel') {
        if (reporte.diesel.litros > 0) {
          const totalLitros = reporte.diesel.litros + volumen
          const totalImporte = reporte.diesel.importe + importe
          reporte.diesel.precio = totalLitros > 0 ? totalImporte / totalLitros : 0
          reporte.diesel.litros = totalLitros
          reporte.diesel.importe = totalImporte
          reporte.diesel.mermaVolumen = reporte.diesel.mermaVolumen + volumenMerma
          reporte.diesel.mermaImporte = reporte.diesel.mermaImporte + importeMerma
          // Calcular promedio ponderado del porcentaje de merma basado en el volumen
          const volumenAnterior = reporte.diesel.litros - volumen
          const volumenTotal = volumenAnterior + volumen
          const porcentajeAnterior = reporte.diesel.mermaPorcentaje
          // Promedio ponderado: (porcentaje1 * volumen1 + porcentaje2 * volumen2) / (volumen1 + volumen2)
          reporte.diesel.mermaPorcentaje = volumenTotal > 0
            ? ((porcentajeAnterior * volumenAnterior) + (mermaPorcentaje * volumen)) / volumenTotal
            : mermaPorcentaje
        } else {
          reporte.diesel.precio = precioUnitario
          reporte.diesel.litros = volumen
          reporte.diesel.importe = importe
          reporte.diesel.mermaVolumen = volumenMerma
          reporte.diesel.mermaImporte = importeMerma
          // Usar el porcentaje que viene de la API directamente
          reporte.diesel.mermaPorcentaje = mermaPorcentaje
        }
      }
    })

    return reportesPorEstacion
  }

  /**
   * Sincroniza los datos de la API externa con la base de datos
   */
  async sincronizarDatos(fechaInicio: string, fechaFin: string, usuarioId: string): Promise<{ creados: number; actualizados: number; errores: number; detalles: string[] }> {
    try {
      console.log(`\n========== INICIANDO SINCRONIZACIÓN ==========`)
      console.log(`Fecha Inicio: ${fechaInicio}`)
      console.log(`Fecha Fin: ${fechaFin}`)
      console.log(`Usuario ID: ${usuarioId}`)
      
      // Obtener credenciales de la base de datos
      const usuarioResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_usuario']
      )
      const contrasenaResult = await pool.query(
        'SELECT valor FROM configuracion WHERE clave = $1',
        ['api_contrasena']
      )

      if (usuarioResult.rows.length === 0 || contrasenaResult.rows.length === 0) {
        throw new Error('No se encontraron las credenciales de la API en la configuración')
      }

      const usuario = usuarioResult.rows[0].valor
      const contrasena = contrasenaResult.rows[0].valor

      if (!usuario || !contrasena) {
        throw new Error('Las credenciales de la API no están configuradas correctamente')
      }

      // Obtener token
      const token = await this.obtenerToken(usuario, contrasena)

      // Obtener datos
      const datos = await this.obtenerDatosReportes(token, fechaInicio, fechaFin)
      console.log(`Total de registros recibidos de API: ${datos.length}`)

      // Mapear datos (ahora es async)
      const reportesMapeados = await this.mapearDatosAReportes(datos)
      console.log(`Total de estaciones mapeadas: ${reportesMapeados.size}`)

      let creados = 0
      let actualizados = 0
      let errores = 0
      const detalles: string[] = []

      // Procesar cada reporte
      for (const [identificador, datosReporte] of reportesMapeados.entries()) {
        try {
          console.log(`\n--- Procesando: Identificador ${identificador} ---`)
          
          // Buscar estación por identificador externo
          const estacionResult = await pool.query(
            'SELECT id, nombre FROM estaciones WHERE identificador_externo = $1',
            [identificador]
          )

          if (estacionResult.rows.length === 0) {
            const mensaje = `❌ ERROR: Estación con identificador "${identificador}" no encontrada en la base de datos`
            console.error(mensaje)
            detalles.push(mensaje)
            errores++
            continue
          }

          const estacionId = estacionResult.rows[0].id
          const estacionNombre = estacionResult.rows[0].nombre
          console.log(`   Estación encontrada: ${estacionNombre} (ID: ${estacionId})`)

          // Verificar si ya existe un reporte para esta estación y fecha
          const reporteExistente = await pool.query(
            'SELECT id FROM reportes WHERE estacion_id = $1 AND fecha::date = $2::date',
            [estacionId, fechaInicio]
          )

          // Preparar productos para guardar
          const productosParaGuardar = {
            premium: {
              precio: datosReporte.premium.precio,
              litros: datosReporte.premium.litros,
              importe: datosReporte.premium.importe || 0,
              mermaVolumen: datosReporte.premium.mermaVolumen || 0,
              mermaImporte: datosReporte.premium.mermaImporte || 0,
              mermaPorcentaje: datosReporte.premium.mermaPorcentaje || 0,
              iib: 0,
              compras: 0,
              cct: 0,
              vDsc: 0,
              dc: 0,
              difVDsc: 0,
              if: 0,
              iffb: 0,
            },
            magna: {
              precio: datosReporte.magna.precio,
              litros: datosReporte.magna.litros,
              importe: datosReporte.magna.importe || 0,
              mermaVolumen: datosReporte.magna.mermaVolumen || 0,
              mermaImporte: datosReporte.magna.mermaImporte || 0,
              mermaPorcentaje: datosReporte.magna.mermaPorcentaje || 0,
              iib: 0,
              compras: 0,
              cct: 0,
              vDsc: 0,
              dc: 0,
              difVDsc: 0,
              if: 0,
              iffb: 0,
            },
            diesel: {
              precio: datosReporte.diesel.precio,
              litros: datosReporte.diesel.litros,
              importe: datosReporte.diesel.importe || 0,
              mermaVolumen: datosReporte.diesel.mermaVolumen || 0,
              mermaImporte: datosReporte.diesel.mermaImporte || 0,
              mermaPorcentaje: datosReporte.diesel.mermaPorcentaje || 0,
              iib: 0,
              compras: 0,
              cct: 0,
              vDsc: 0,
              dc: 0,
              difVDsc: 0,
              if: 0,
              iffb: 0,
            },
          }

          // Función helper para guardar productos
          const guardarProductosReporte = async (reporteId: string, productos: any, esActualizacion: boolean = false) => {
            // Obtener la fecha del reporte (necesaria para particionamiento)
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

              // Calcular eficiencia real
              const precio = parseFloat(datos.precio || 0)
              const litros = parseFloat(datos.litros || 0)
              const ifVal = parseFloat(datos.if || 0)
              const iffbVal = parseFloat(datos.iffb || 0)
              
              const eficienciaReal = iffbVal - ifVal
              const eficienciaImporte = eficienciaReal * precio
              let eficienciaRealPorcentaje = litros > 0 ? (eficienciaReal / litros) * 100 : 0
              
              // Validar y limitar eficienciaRealPorcentaje a DECIMAL(8,4) - máximo 9999.9999
              if (eficienciaRealPorcentaje > 9999.9999) {
                console.warn(`[apiExterna] Advertencia: eficienciaRealPorcentaje excede límite (${eficienciaRealPorcentaje}), limitando a 9999.9999`)
                eficienciaRealPorcentaje = 9999.9999
              } else if (eficienciaRealPorcentaje < -9999.9999) {
                console.warn(`[apiExterna] Advertencia: eficienciaRealPorcentaje excede límite negativo (${eficienciaRealPorcentaje}), limitando a -9999.9999`)
                eficienciaRealPorcentaje = -9999.9999
              }

              await pool.query(
                `
                INSERT INTO reporte_productos (
                  reporte_id, producto_id, precio, litros, importe,
                  merma_volumen, merma_importe, merma_porcentaje,
                  iib, compras, cct, v_dsc, dc, dif_v_dsc, if, iffb,
                  eficiencia_real, eficiencia_importe, eficiencia_real_porcentaje, fecha
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                `,
                [
                  reporteId,
                  productoId,
                  precio,
                  litros,
                  datos.importe || 0,
                  datos.mermaVolumen || 0,
                  datos.mermaImporte || 0,
                  datos.mermaPorcentaje || 0,
                  datos.iib || 0,
                  datos.compras || 0,
                  datos.cct || 0,
                  datos.vDsc || 0,
                  datos.dc || 0,
                  datos.difVDsc || 0,
                  ifVal,
                  iffbVal,
                  eficienciaReal,
                  eficienciaImporte,
                  eficienciaRealPorcentaje,
                  fechaReporte,
                ]
              )
            }
          }

          if (reporteExistente.rows.length > 0) {
            // Actualizar reporte existente (solo campos generales)
            await pool.query(
              `UPDATE reportes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
              [reporteExistente.rows[0].id]
            )
            // Actualizar productos
            await guardarProductosReporte(reporteExistente.rows[0].id, productosParaGuardar, true)
            actualizados++
            const mensaje = `✅ ACTUALIZADO: ${estacionNombre} - Fecha: ${fechaInicio}`
            console.log(`   ${mensaje}`)
            detalles.push(mensaje)
          } else {
            // Crear nuevo reporte (solo campos generales)
            const result = await pool.query(
              `
              INSERT INTO reportes (estacion_id, fecha, estado, creado_por)
              VALUES ($1, $2::date, $3, $4)
              RETURNING id
              `,
              [estacionId, fechaInicio, 'Pendiente', usuarioId]
            )
            // Guardar productos
            await guardarProductosReporte(result.rows[0].id, productosParaGuardar, false)
            creados++
            const mensaje = `✅ CREADO: ${estacionNombre} - Fecha: ${fechaInicio}`
            console.log(`   ${mensaje}`)
            detalles.push(mensaje)
          }
        } catch (error: any) {
          const mensaje = `❌ ERROR: Estación "${identificador}" - ${error.message || error}`
          console.error(mensaje)
          console.error('   Detalle completo:', error)
          detalles.push(mensaje)
          errores++
        }
      }

      console.log(`\n========== RESUMEN DE SINCRONIZACIÓN ==========`)
      console.log(`✅ Creados: ${creados}`)
      console.log(`🔄 Actualizados: ${actualizados}`)
      console.log(`❌ Errores: ${errores}`)
      console.log(`===============================================\n`)

      return { creados, actualizados, errores, detalles }
    } catch (error) {
      console.error('Error al sincronizar datos:', error)
      throw error
    }
  }
}

export const apiExternaService = new ApiExternaService()

