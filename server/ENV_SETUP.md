# Configuración de Variables de Entorno

Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=repvtas
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres

# JWT
JWT_SECRET=tu-secret-key-super-seguro-cambiar-en-produccion

# Server
PORT=5000

# Frontend
FRONTEND_URL=http://localhost:3000

# OAuth (opcional - configurar si quieres usar autenticación social)
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GITHUB_CLIENT_ID=tu-github-client-id
GITHUB_CLIENT_SECRET=tu-github-client-secret
```

## Notas importantes:

1. **DB_PASSWORD**: Cambia por tu contraseña de PostgreSQL
2. **JWT_SECRET**: Debe ser una cadena larga y aleatoria en producción
3. **OAuth**: Las credenciales de OAuth son opcionales. Si no las configuras, el login tradicional seguirá funcionando.

## Obtener credenciales OAuth:

### Google OAuth:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:5000/api/auth/google/callback` como URL de redirección

### GitHub OAuth:
1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Crea una nueva OAuth App
3. Agrega `http://localhost:5000/api/auth/github/callback` como Callback URL

