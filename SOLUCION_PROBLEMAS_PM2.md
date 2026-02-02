# 🔧 Solución de Problemas con PM2

## Problema 1: Error de Autenticación de PostgreSQL

Si ves el error `auth_failed` en los logs del backend:

### Solución:

1. **Verificar que el usuario de PostgreSQL existe:**
```bash
sudo -u postgres psql -c "\du"
```

2. **Verificar credenciales en .env:**
```bash
cd /home/webops/ReporteVentas/server
cat .env | grep DB_
```

3. **Crear/usar usuario correcto:**
```bash
sudo -u postgres psql <<EOF
CREATE USER webops WITH PASSWORD 'qwerty';
ALTER USER webops CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE repvtas TO webops;
EOF
```

4. **O usar el usuario postgres:**
```bash
cd /home/webops/ReporteVentas/server
# Editar .env y cambiar:
# DB_USER=postgres
# DB_PASSWORD=tu_contraseña_de_postgres
```

## Problema 2: Frontend no inicia

Si el frontend muestra errores:

1. **Verificar que dist/ existe:**
```bash
cd /home/webops/ReporteVentas
ls -la dist/
```

2. **Recompilar si es necesario:**
```bash
pnpm build
```

3. **Verificar permisos:**
```bash
sudo chown -R webops:webops dist/
```

## Problema 3: Procesos se reinician constantemente

Si PM2 reinicia los procesos muchas veces:

1. **Ver logs detallados:**
```bash
pm2 logs --lines 50
```

2. **Verificar errores específicos:**
```bash
pm2 logs repvtas-backend --err
pm2 logs repvtas-frontend --err
```

3. **Reiniciar limpiamente:**
```bash
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
```

## Comandos de Diagnóstico

```bash
# Ver estado
pm2 status

# Ver información detallada
pm2 show repvtas-backend
pm2 show repvtas-frontend

# Ver logs en tiempo real
pm2 logs

# Monitoreo
pm2 monit

# Verificar que los puertos estén libres
netstat -tulpn | grep -E "3000|5000"

# Probar endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000
```

## Reinicio Completo

Si nada funciona, reinicia todo:

```bash
cd /home/webops/ReporteVentas

# Detener todo
pm2 delete all

# Verificar que no hay procesos corriendo
pm2 status

# Reiniciar
pm2 start ecosystem.config.cjs

# Guardar
pm2 save

# Verificar
pm2 status
pm2 logs --lines 20
```
