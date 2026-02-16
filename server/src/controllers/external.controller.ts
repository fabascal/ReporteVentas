import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../config/database.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRATION = '15m' // 15 minutos

export const externalController = {
  // Autenticación con API Key y Secret
  async authenticate(req: Request, res: Response) {
    try {
      const { api_key, api_secret } = req.body

      if (!api_key || !api_secret) {
        return res.status(400).json({
          success: false,
          error: 'API key y API secret son requeridos'
        })
      }

      // Buscar usuario API en la base de datos
      const result = await pool.query(
        `SELECT id, api_key, api_secret, nombre, estaciones_permitidas, activo
         FROM api_users
         WHERE api_key = $1 AND activo = true`,
        [api_key]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'API key inválida'
        })
      }

      const apiUser = result.rows[0]

      // Validar API secret (en producción debería usar hash)
      if (apiUser.api_secret !== api_secret) {
        return res.status(401).json({
          success: false,
          error: 'API secret inválida'
        })
      }

      // Generar token JWT
      const expiresIn = 900 // 15 minutos en segundos
      const expiresAt = new Date(Date.now() + expiresIn * 1000)

      const token = jwt.sign(
        {
          id: apiUser.id,
          api_key: apiUser.api_key,
          nombre: apiUser.nombre,
          estaciones_permitidas: apiUser.estaciones_permitidas,
          type: 'api_external'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      )

      // Registrar acceso
      await pool.query(
        `INSERT INTO api_access_log (api_user_id, ip_address, user_agent)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [apiUser.id, req.ip, req.headers['user-agent'] || '']
      ).catch(() => {
        // Si la tabla no existe, continuamos sin registrar
      })

      res.json({
        success: true,
        token,
        expires_in: expiresIn,
        expires_at: expiresAt.toISOString(),
        api_key: apiUser.api_key,
        nombre: apiUser.nombre
      })

    } catch (error) {
      console.error('Error en autenticación externa:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // Validar token
  async validateToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token no proporcionado'
        })
      }

      const token = authHeader.substring(7)

      jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (err) {
          return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
          })
        }

        res.json({
          success: true,
          valid: true,
          api_key: decoded.api_key,
          nombre: decoded.nombre,
          type: decoded.type,
          expires_at: new Date(decoded.exp * 1000).toISOString()
        })
      })

    } catch (error) {
      console.error('Error validando token:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // Renovar token
  async refreshToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token no proporcionado'
        })
      }

      const token = authHeader.substring(7)

      jwt.verify(token, JWT_SECRET, async (err, decoded: any) => {
        if (err) {
          return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
          })
        }

        // Verificar que el usuario API aún esté activo
        const result = await pool.query(
          `SELECT id, api_key, nombre, estaciones_permitidas, activo
           FROM api_users
           WHERE id = $1 AND activo = true`,
          [decoded.id]
        )

        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            error: 'Usuario API no encontrado o inactivo'
          })
        }

        const apiUser = result.rows[0]

        // Generar nuevo token
        const expiresIn = 900 // 15 minutos en segundos
        const expiresAt = new Date(Date.now() + expiresIn * 1000)

        const newToken = jwt.sign(
          {
            id: apiUser.id,
            api_key: apiUser.api_key,
            nombre: apiUser.nombre,
            estaciones_permitidas: apiUser.estaciones_permitidas,
            type: 'api_external'
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRATION }
        )

        res.json({
          success: true,
          token: newToken,
          expires_in: expiresIn,
          expires_at: expiresAt.toISOString(),
          api_key: apiUser.api_key,
          nombre: apiUser.nombre
        })
      })

    } catch (error) {
      console.error('Error renovando token:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // Obtener reportes mensuales agregados por estación
  async getReportesMensuales(req: Request, res: Response) {
    try {
      const { identificador_externo, anio, mes } = req.query

      if (!identificador_externo || !anio || !mes) {
        return res.status(400).json({
          success: false,
          error: 'identificador_externo, anio y mes son requeridos'
        })
      }

      // Buscar la estación por identificador externo
      const estacionResult = await pool.query(
        `SELECT id, nombre, identificador_externo
         FROM estaciones
         WHERE identificador_externo = $1`,
        [identificador_externo]
      )

      if (estacionResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Estación no encontrada'
        })
      }

      const estacion = estacionResult.rows[0]

      // Buscar datos agregados mensuales
      const agregadosResult = await pool.query(
        `SELECT 
          premium_volumen_total, premium_importe_total, premium_precio_promedio,
          premium_merma_volumen_total, premium_merma_importe_total, premium_merma_porcentaje_promedio,
          premium_eficiencia_real_total, premium_eficiencia_importe_total, premium_eficiencia_real_porcentaje_promedio,
          magna_volumen_total, magna_importe_total, magna_precio_promedio,
          magna_merma_volumen_total, magna_merma_importe_total, magna_merma_porcentaje_promedio,
          magna_eficiencia_real_total, magna_eficiencia_importe_total, magna_eficiencia_real_porcentaje_promedio,
          diesel_volumen_total, diesel_importe_total, diesel_precio_promedio,
          diesel_merma_volumen_total, diesel_merma_importe_total, diesel_merma_porcentaje_promedio,
          diesel_eficiencia_real_total, diesel_eficiencia_importe_total, diesel_eficiencia_real_porcentaje_promedio,
          total_ventas, aceites_total, dias_reportados,
          created_at
         FROM reportes_mensuales
         WHERE estacion_id = $1 AND anio = $2 AND mes = $3`,
        [estacion.id, parseInt(anio as string), parseInt(mes as string)]
      )

      if (agregadosResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No se encontraron datos para el periodo especificado'
        })
      }

      const datos = agregadosResult.rows[0]

      // Formatear respuesta
      const response = {
        success: true,
        data: {
          estacion: {
            id: estacion.id,
            nombre: estacion.nombre,
            identificador_externo: estacion.identificador_externo
          },
          periodo: {
            mes: parseInt(mes as string),
            anio: parseInt(anio as string)
          },
          agregados: {
            premium: {
              total_litros: Math.round(parseFloat(datos.premium_volumen_total || '0') * 100) / 100,
              total_importe: Math.round(parseFloat(datos.premium_importe_total || '0') * 100) / 100,
              precio_promedio: Math.round(parseFloat(datos.premium_precio_promedio || '0') * 100) / 100,
              total_merma_volumen: Math.round(parseFloat(datos.premium_merma_volumen_total || '0') * 100) / 100,
              total_merma_importe: Math.round(parseFloat(datos.premium_merma_importe_total || '0') * 100) / 100,
              merma_porcentaje_promedio: Math.round(parseFloat(datos.premium_merma_porcentaje_promedio || '0') * 100) / 100,
              total_eficiencia_real: Math.round(parseFloat(datos.premium_eficiencia_real_total || '0') * 100) / 100,
              total_eficiencia_importe: Math.round(parseFloat(datos.premium_eficiencia_importe_total || '0') * 100) / 100,
              eficiencia_real_porcentaje_promedio: Math.round(parseFloat(datos.premium_eficiencia_real_porcentaje_promedio || '0') * 100) / 100
            },
            magna: {
              total_litros: Math.round(parseFloat(datos.magna_volumen_total || '0') * 100) / 100,
              total_importe: Math.round(parseFloat(datos.magna_importe_total || '0') * 100) / 100,
              precio_promedio: Math.round(parseFloat(datos.magna_precio_promedio || '0') * 100) / 100,
              total_merma_volumen: Math.round(parseFloat(datos.magna_merma_volumen_total || '0') * 100) / 100,
              total_merma_importe: Math.round(parseFloat(datos.magna_merma_importe_total || '0') * 100) / 100,
              merma_porcentaje_promedio: Math.round(parseFloat(datos.magna_merma_porcentaje_promedio || '0') * 100) / 100,
              total_eficiencia_real: Math.round(parseFloat(datos.magna_eficiencia_real_total || '0') * 100) / 100,
              total_eficiencia_importe: Math.round(parseFloat(datos.magna_eficiencia_importe_total || '0') * 100) / 100,
              eficiencia_real_porcentaje_promedio: Math.round(parseFloat(datos.magna_eficiencia_real_porcentaje_promedio || '0') * 100) / 100
            },
            diesel: {
              total_litros: Math.round(parseFloat(datos.diesel_volumen_total || '0') * 100) / 100,
              total_importe: Math.round(parseFloat(datos.diesel_importe_total || '0') * 100) / 100,
              precio_promedio: Math.round(parseFloat(datos.diesel_precio_promedio || '0') * 100) / 100,
              total_merma_volumen: Math.round(parseFloat(datos.diesel_merma_volumen_total || '0') * 100) / 100,
              total_merma_importe: Math.round(parseFloat(datos.diesel_merma_importe_total || '0') * 100) / 100,
              merma_porcentaje_promedio: Math.round(parseFloat(datos.diesel_merma_porcentaje_promedio || '0') * 100) / 100,
              total_eficiencia_real: Math.round(parseFloat(datos.diesel_eficiencia_real_total || '0') * 100) / 100,
              total_eficiencia_importe: Math.round(parseFloat(datos.diesel_eficiencia_importe_total || '0') * 100) / 100,
              eficiencia_real_porcentaje_promedio: Math.round(parseFloat(datos.diesel_eficiencia_real_porcentaje_promedio || '0') * 100) / 100
            },
            totales: {
              total_ventas: Math.round(parseFloat(datos.total_ventas || '0') * 100) / 100,
              total_aceites: Math.round(parseFloat(datos.aceites_total || '0') * 100) / 100,
              dias_reportados: parseInt(datos.dias_reportados || '0'),
              gran_total: Math.round((parseFloat(datos.total_ventas || '0') + parseFloat(datos.aceites_total || '0')) * 100) / 100
            }
          },
          metadata: {
            created_at: datos.created_at
          }
        }
      }

      res.json(response)

    } catch (error) {
      console.error('Error obteniendo reportes mensuales:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // Obtener eficiencia de todas las estaciones agrupadas por zona
  async getEficienciaEstaciones(req: Request, res: Response) {
    try {
      const { anio, mes } = req.query

      if (!anio || !mes) {
        return res.status(400).json({
          success: false,
          error: 'anio y mes son requeridos'
        })
      }

      // Obtener todas las zonas
      const zonasResult = await pool.query(
        `SELECT id, nombre
         FROM zonas
         WHERE activa = TRUE
         ORDER BY nombre`
      )

      const zonas = []
      let totalEstaciones = 0

      for (const zona of zonasResult.rows) {
        // Obtener estaciones de la zona con sus datos de eficiencia (merma)
        const estacionesResult = await pool.query(
          `SELECT 
            e.id, e.nombre, e.identificador_externo,
            rm.premium_merma_volumen_total as premium_litros,
            rm.premium_merma_porcentaje_promedio as premium_porcentaje,
            rm.magna_merma_volumen_total as magna_litros,
            rm.magna_merma_porcentaje_promedio as magna_porcentaje,
            rm.diesel_merma_volumen_total as diesel_litros,
            rm.diesel_merma_porcentaje_promedio as diesel_porcentaje,
            rm.dias_reportados,
            rm.created_at as fecha_actualizacion
           FROM estaciones e
           LEFT JOIN reportes_mensuales rm ON e.id = rm.estacion_id 
             AND rm.anio = $1 AND rm.mes = $2
           WHERE e.zona_id = $3 AND e.activa = TRUE
           ORDER BY e.nombre`,
          [parseInt(anio as string), parseInt(mes as string), zona.id]
        )

        const estaciones = estacionesResult.rows.map(est => ({
          id: est.id,
          nombre: est.nombre,
          identificador_externo: est.identificador_externo,
          eficiencia: {
            premium: {
              litros: Math.round(parseFloat(est.premium_litros || '0') * 100) / 100,
              porcentaje: Math.round(parseFloat(est.premium_porcentaje || '0') * 100) / 100
            },
            magna: {
              litros: Math.round(parseFloat(est.magna_litros || '0') * 100) / 100,
              porcentaje: Math.round(parseFloat(est.magna_porcentaje || '0') * 100) / 100
            },
            diesel: {
              litros: Math.round(parseFloat(est.diesel_litros || '0') * 100) / 100,
              porcentaje: Math.round(parseFloat(est.diesel_porcentaje || '0') * 100) / 100
            }
          },
          dias_reportados: parseInt(est.dias_reportados || '0'),
          fecha_actualizacion: est.fecha_actualizacion
        }))

        totalEstaciones += estaciones.length

        zonas.push({
          nombre: zona.nombre,
          total_estaciones: estaciones.length,
          estaciones
        })
      }

      const response = {
        success: true,
        data: {
          periodo: {
            mes: parseInt(mes as string),
            anio: parseInt(anio as string)
          },
          total_estaciones: totalEstaciones,
          total_zonas: zonas.length,
          zonas
        }
      }

      res.json(response)

    } catch (error) {
      console.error('Error obteniendo eficiencia de estaciones:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  },

  // Obtener conciliación mensual por zona
  async getConciliacionMensual(req: Request, res: Response) {
    try {
      const { anio, mes } = req.query

      if (!anio || !mes) {
        return res.status(400).json({
          success: false,
          error: 'anio y mes son requeridos'
        })
      }

      const anioInt = parseInt(anio as string)
      const mesInt = parseInt(mes as string)

      // Obtener todas las zonas que tienen estaciones activas
      const zonasResult = await pool.query(
        `SELECT DISTINCT z.id as zona_id, z.nombre as zona_nombre
         FROM zonas z
         INNER JOIN estaciones e ON e.zona_id = z.id AND e.activa = true
         ORDER BY z.nombre`
      )

      const zonas = []

      for (const zona of zonasResult.rows) {
        // Obtener todas las estaciones activas de la zona (incluso sin reportes)
        const estacionesResult = await pool.query(
          `SELECT 
            e.id as estacion_id,
            e.nombre as estacion_nombre,
            e.identificador_externo,
            rm.premium_merma_volumen_total,
            rm.premium_merma_importe_total,
            rm.magna_merma_volumen_total,
            rm.magna_merma_importe_total,
            rm.diesel_merma_volumen_total,
            rm.diesel_merma_importe_total
           FROM estaciones e
           LEFT JOIN reportes_mensuales rm ON rm.estacion_id = e.id 
             AND rm.anio = $2 
             AND rm.mes = $3
           WHERE e.zona_id = $1 
             AND e.activa = true
           ORDER BY e.nombre`,
          [zona.zona_id, anioInt, mesInt]
        )

        const estaciones = []
        let totalMermaZona = 0
        let totalEntregasZona = 0

        for (const est of estacionesResult.rows) {
          // Calcular precios (merma_importe / merma_volumen)
          const premiumVolumen = parseFloat(est.premium_merma_volumen_total || '0')
          const premiumImporte = parseFloat(est.premium_merma_importe_total || '0')
          const premiumPrecio = premiumVolumen > 0 ? premiumImporte / premiumVolumen : 0

          const magnaVolumen = parseFloat(est.magna_merma_volumen_total || '0')
          const magnaImporte = parseFloat(est.magna_merma_importe_total || '0')
          const magnaPrecio = magnaVolumen > 0 ? magnaImporte / magnaVolumen : 0

          const dieselVolumen = parseFloat(est.diesel_merma_volumen_total || '0')
          const dieselImporte = parseFloat(est.diesel_merma_importe_total || '0')
          const dieselPrecio = dieselVolumen > 0 ? dieselImporte / dieselVolumen : 0

          const totalMermaEstacion = premiumImporte + magnaImporte + dieselImporte
          totalMermaZona += totalMermaEstacion

          // Calcular total_entregas como la suma de eficiencia_importe de todos los productos del periodo
          const eficienciaResult = await pool.query(
            `SELECT 
              SUM(rp.eficiencia_importe) as total_eficiencia
             FROM reportes r
             INNER JOIN reporte_productos rp ON rp.reporte_id = r.id
             WHERE r.estacion_id = $1
               AND EXTRACT(YEAR FROM r.fecha) = $2
               AND EXTRACT(MONTH FROM r.fecha) = $3
               AND r.estado = 'Aprobado'`,
            [est.estacion_id, anioInt, mesInt]
          )

          const totalEntregas = parseFloat(eficienciaResult.rows[0]?.total_eficiencia || '0')
          const diferencia = totalEntregas - totalMermaEstacion
          
          totalEntregasZona += totalEntregas

          // Buscar entregas de la estación al gerente de zona en el mes (solo para información)
          const entregasResult = await pool.query(
            `SELECT 
              fecha,
              monto,
              concepto
             FROM entregas
             WHERE estacion_id = $1
               AND zona_id = $2
               AND tipo_entrega = 'estacion_zona'
               AND EXTRACT(YEAR FROM fecha) = $3
               AND EXTRACT(MONTH FROM fecha) = $4
             ORDER BY fecha`,
            [est.estacion_id, zona.zona_id, anioInt, mesInt]
          )

          const entregas = entregasResult.rows.map(e => ({
            fecha: e.fecha,
            monto: Math.round(parseFloat(e.monto) * 100) / 100,
            concepto: e.concepto
          }))

          estaciones.push({
            identificador_externo: est.identificador_externo,
            nombre: est.estacion_nombre,
            productos: {
              premium: {
                merma_volumen: Math.round(premiumVolumen * 10000) / 10000,
                precio: Math.round(premiumPrecio * 10000) / 10000,
                merma_monto: Math.round(premiumImporte * 10000) / 10000
              },
              magna: {
                merma_volumen: Math.round(magnaVolumen * 10000) / 10000,
                precio: Math.round(magnaPrecio * 10000) / 10000,
                merma_monto: Math.round(magnaImporte * 10000) / 10000
              },
              diesel: {
                merma_volumen: Math.round(dieselVolumen * 10000) / 10000,
                precio: Math.round(dieselPrecio * 10000) / 10000,
                merma_monto: Math.round(dieselImporte * 10000) / 10000
              }
            },
            total_merma: Math.round(totalMermaEstacion * 10000) / 10000,
            total_entregas: Math.round(totalEntregas * 10000) / 10000,
            diferencia: Math.round(diferencia * 10000) / 10000,
            entregas_efectivo: entregas.length > 0 ? entregas : undefined,
            total_entregas_efectivo: entregas.length > 0 ? Math.round(entregas.reduce((sum, e) => sum + e.monto, 0) * 100) / 100 : undefined
          })
        }

        const diferenciaZona = totalEntregasZona - totalMermaZona

        zonas.push({
          zona: zona.zona_nombre,
          total_merma_zona: Math.round(totalMermaZona * 10000) / 10000,
          total_entregas_zona: Math.round(totalEntregasZona * 10000) / 10000,
          diferencia_zona: Math.round(diferenciaZona * 10000) / 10000,
          total_estaciones: estaciones.length,
          estaciones
        })
      }

      const response = {
        success: true,
        data: {
          periodo: {
            mes: mesInt,
            anio: anioInt
          },
          total_zonas: zonas.length,
          zonas
        }
      }

      res.json(response)

    } catch (error) {
      console.error('Error obteniendo conciliación mensual:', error)
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      })
    }
  }
}
