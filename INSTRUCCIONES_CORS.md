# 🔧 Instrucciones para Resolver CORS

## ✅ Estado Actual

- ✅ **Backend CORS**: Configurado correctamente
- ✅ **Backend**: Funcionando en puerto 5000
- ⚠️ **Frontend**: Necesita recompilarse con la URL correcta

## 🔨 Recompilar Frontend

El frontend necesita recompilarse para usar la IP pública del backend. Ejecuta:

```bash
cd /home/webops/ReporteVentas

# Opción 1: Usar el script (recomendado)
bash recompilar-frontend.sh

# Opción 2: Manualmente
# 1. Limpiar dist (puede requerir sudo)
sudo rm -rf dist

# 2. Asegurar que .env tiene la URL correcta
cat > .env <<EOF
VITE_API_URL=http://189.206.183.110:5000/api
EOF

# 3. Compilar
pnpm build

# 4. Reiniciar frontend
pm2 restart repvtas-frontend
```

## ✅ Verificación

Después de recompilar:

```bash
# Verificar que el frontend tiene la URL correcta
grep -r "189.206.183.110:5000" dist/assets/*.js | head -1

# Probar que funciona
curl http://localhost:3030
```

## 🔍 Verificar CORS

El backend ya está configurado correctamente. Puedes verificar con:

```bash
curl -H "Origin: http://189.206.183.110:3030" \
     -X OPTIONS \
     http://localhost:5000/api/auth/login \
     -v
```

Debería mostrar:
```
Access-Control-Allow-Origin: http://189.206.183.110:3030
Access-Control-Allow-Credentials: true
```

## 📝 Cambios Realizados

1. ✅ Backend CORS actualizado para permitir IP pública
2. ✅ Variables de entorno actualizadas en `ecosystem.config.cjs`
3. ✅ Archivo `.env` creado con `VITE_API_URL`
4. ⚠️ Frontend necesita recompilarse (ejecuta el script arriba)

## 🚀 Después de Recompilar

Una vez recompilado, el frontend debería funcionar correctamente desde `http://189.206.183.110:3030` sin errores de CORS.
