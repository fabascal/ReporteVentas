# 🔧 Solución de Error CORS

## Problema

El frontend accede desde `http://189.206.183.110:3030` pero el backend solo permitía `localhost`, causando error de CORS.

## Solución Aplicada

### 1. Backend - Configuración de CORS

Se actualizó `server/src/index.ts` para permitir:
- IP pública: `189.206.183.110`
- Puertos: 3000 y 3030
- Localhost (para desarrollo)

### 2. Variables de Entorno

Se actualizó `ecosystem.config.cjs` con:
```javascript
FRONTEND_URL: 'http://189.206.183.110:3000,http://189.206.183.110:3030,http://localhost:3000,http://localhost:3030'
```

### 3. Frontend - URL del API

Se creó archivo `.env` en la raíz con:
```
VITE_API_URL=http://189.206.183.110:5000/api
```

Y se recompiló el frontend para usar esta URL.

## Verificación

```bash
# Verificar que el backend está corriendo
pm2 status

# Probar CORS desde la IP pública
curl -H "Origin: http://189.206.183.110:3030" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://189.206.183.110:5000/api/auth/login
```

## Si el Frontend está en Puerto 3030

Si el frontend está corriendo en el puerto 3030 (no 3000), actualiza:

1. **ecosystem.config.cjs** - Cambiar el puerto del frontend:
```javascript
args: ['serve', '-s', 'dist', '-l', '3030'],
```

2. Reiniciar:
```bash
pm2 restart repvtas-frontend
```

## Nota de Seguridad

Para producción, considera:
- Restringir los orígenes permitidos solo a los necesarios
- Usar HTTPS en lugar de HTTP
- Configurar un dominio en lugar de usar IPs directamente
