// Configuración de PM2 para producción
module.exports = {
  apps: [
    {
      name: 'repvtas-backend',
      script: './server/dist/index.js',
      cwd: '/home/webops/ReporteVentas',
      instances: 1,
      exec_mode: 'fork',
      env_file: './server/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'repvtas',
        DB_USER: 'webops',
        DB_PASSWORD: 'qwerty',
        FRONTEND_URL: 'http://189.206.183.110:3000,http://189.206.183.110:3030,http://localhost:3000,http://localhost:3030'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10
    },
    {
      name: 'repvtas-frontend',
      script: 'npx',
      args: ['serve', '-s', 'dist', '-l', '3000'],
      cwd: '/home/webops/ReporteVentas',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
}
