# ✅ Error CORS Resuelto

## Problema

El frontend accede desde `http://189.206.183.110:3030` pero el backend solo permitía `localhost`, causando error de CORS.

## Soluciones Aplicadas

### 1. Backend - Configuración de CORS

Se actualizó `server/src/index.ts` para permitir:
- ✅ IP pública: `189.206.183.110`
- ✅ Puertos: 3000 y 3030
- ✅ Localhost (para desarrollo)
- ✅ En producción, permite todos los orígenes (ajustar según seguridad)

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

### 4. Puerto del Frontend

Se actualizó `ecosystem.config.cjs` para que el frontend corra en el puerto 3030:
```javascript
args: ['serve', '-s', 'dist', '-l', '3030'],
```

## Verificación

```bash
# Ver estado
pm2 status

# Probar backend
curl http://localhost:5000/api/health

# Probar frontend
curl http://localhost:3030
```

## Si el Error Persiste

1. **Verificar que el backend esté usando las nuevas variables:**
```bash
pm2 restart repvtas-backend --update-env
```

2. **Verificar que el frontend esté recompilado:**
```bash
cd /home/webops/ReporteVentas
grep -r "189.206.183.110:5000" dist/ || echo "Necesita recompilar"
```

3. **Recompilar frontend:**
```bash
cd /home/webops/ReporteVentas
pnpm build
pm2 restart repvtas-frontend
```

## Nota de Seguridad

Para producción, considera restringir los orígenes permitidos solo a los necesarios en lugar de permitir todos en producción. La configuración actual permite todos los orígenes en producción para facilitar el acceso, pero deberías ajustarlo según tus necesidades de seguridad.
