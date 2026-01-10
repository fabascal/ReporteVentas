import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware.js'
import { apiExternaService } from '../services/apiExterna.service.js'
import { pool } from '../config/database.js'

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

