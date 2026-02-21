import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './config/database.js'
import { authRoutes } from './routes/auth.routes.js'
import { usuariosRoutes } from './routes/usuarios.routes.js'
import { zonasRoutes } from './routes/zonas.routes.js'
import { estacionesRoutes } from './routes/estaciones.routes.js'
import { productosRoutes } from './routes/productos.routes.js'
import { configuracionRoutes } from './routes/configuracion.routes.js'
import { menusRoutes } from './routes/menus.routes.js'
import rolesRoutes from './routes/roles.routes.js'
import financieroRoutes from './routes/financiero.routes.js'
import cierreMensualRoutes from './routes/cierreMensual.routes.js'
import ejerciciosRoutes from './routes/ejercicios.routes.js'
import { reportesRoutes } from './routes/reportes.routes.js'
import externalRoutes from './routes/external.routes.js'
import { importExcelRoutes } from './routes/importExcel.routes.js'
import { backupService } from './services/backup.service.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/zonas', zonasRoutes)
app.use('/api/estaciones', estacionesRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/menus', menusRoutes)
app.use('/api/roles', rolesRoutes)
app.use('/api/financiero', financieroRoutes)
app.use('/api/cierre-mensual', cierreMensualRoutes)
app.use('/api/ejercicios', ejerciciosRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/external', externalRoutes)
app.use('/api/import-excel', importExcelRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
const startServer = async () => {
  try {
    await initDatabase()
    await backupService.startScheduler()
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
