# 🔧 Comando Necesario para Recompilar Frontend

## ⚠️ Problema

Algunos archivos en `dist` pertenecen a `root` y necesitan ser eliminados con `sudo`.

## ✅ Solución

Ejecuta este comando:

```bash
sudo rm -rf /home/webops/ReporteVentas/dist
```

Luego ejecuta:

```bash
cd /home/webops/ReporteVentas
bash fix-dist-permissions.sh
```

## 🔄 Alternativa: Todo en uno

Si prefieres hacerlo todo manualmente:

```bash
cd /home/webops/ReporteVentas

# 1. Eliminar dist (requiere sudo)
sudo rm -rf dist

# 2. Verificar que .env existe
cat .env
# Debe mostrar: VITE_API_URL=http://189.206.183.110:5000/api

# 3. Compilar
pnpm build

# 4. Reiniciar frontend
pm2 restart repvtas-frontend

# 5. Verificar
curl http://localhost:3030
```

## ✅ Después de Recompilar

El frontend debería funcionar correctamente desde `http://189.206.183.110:3030` sin errores de CORS.

El backend ya está configurado correctamente y está respondiendo a las peticiones CORS.
