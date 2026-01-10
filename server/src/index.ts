import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRoutes } from './routes/auth.routes.js'
import { reportesRoutes } from './routes/reportes.routes.js'
import { estacionesRoutes } from './routes/estaciones.routes.js'
import { zonasRoutes } from './routes/zonas.routes.js'
import { usuariosRoutes } from './routes/usuarios.routes.js'
import { configuracionRoutes } from './routes/configuracion.routes.js'
import { productosRoutes } from './routes/productos.routes.js'
import { menusRoutes } from './routes/menus.routes.js'
import rolesRoutes from './routes/roles.routes.js'
import { initDatabase } from './config/database.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
// Configurar CORS para permitir múltiples orígenes
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000']

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Si el origin está en la lista permitida o es localhost
    if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true)
    } else {
      // En desarrollo, permitir todos los orígenes
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/estaciones', estacionesRoutes)
app.use('/api/zonas', zonasRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/configuracion', configuracionRoutes)
app.use('/api/productos', productosRoutes)
app.use('/api/menus', menusRoutes)
app.use('/api/roles', rolesRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Initialize database and start server
initDatabase()
  .then(() => {
    // Escuchar en todas las interfaces (0.0.0.0) para permitir acceso desde la red
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`)
      console.log(`📡 Accessible from network on port ${PORT}`)
      console.log(`🔗 Local access: http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('❌ Error initializing database:', error)
    process.exit(1)
  })

