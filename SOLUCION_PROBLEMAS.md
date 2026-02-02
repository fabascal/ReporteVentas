# 🔧 Solución de Problemas

## Problema 1: No puedo editar el archivo .env

El archivo `.env` es propiedad de root. Soluciones:

### Opción A: Cambiar propietario (requiere sudo)
```bash
sudo chown webops:webops /home/webops/ReporteVentas/server/.env
```

### Opción B: Usar .env.local (ya configurado)
Ya se creó `server/.env.local` con los mismos valores. El código ha sido modificado para usar `.env.local` si `.env` no está disponible.

### Opción C: Crear nuevo .env
```bash
cd /home/webops/ReporteVentas/server
cp .env.local .env
# Si falla por permisos, usa:
cat .env.local > .env
```

## Problema 2: Errores de compilación TypeScript

Los errores ocurren porque:
1. **Las dependencias no están instaladas** - `node_modules` tiene archivos de root
2. **Falta @types/node** en la configuración

### Solución: Limpiar e instalar dependencias

```bash
cd /home/webops/ReporteVentas

# Limpiar node_modules (puede requerir sudo para algunos archivos)
sudo rm -rf node_modules server/node_modules

# Instalar dependencias
CI=true pnpm install
cd server
CI=true pnpm install
cd ..
```

Si algunos archivos no se pueden eliminar:
```bash
sudo find /home/webops/ReporteVentas -type d -name node_modules -exec rm -rf {} + 2>/dev/null
sudo find /home/webops/ReporteVentas -type f -user root -name "package-lock.json" -delete
```

## Problema 3: Permisos en node_modules

Si `node_modules` tiene archivos de root:

```bash
# Cambiar propietario de todo el proyecto
sudo chown -R webops:webops /home/webops/ReporteVentas
```

## Pasos Recomendados para Resolver Todo

```bash
cd /home/webops/ReporteVentas

# 1. Limpiar todo (con sudo si es necesario)
sudo rm -rf node_modules server/node_modules
sudo chown -R webops:webops /home/webops/ReporteVentas

# 2. Corregir .env
sudo chown webops:webops server/.env
# O usar .env.local (ya está configurado)

# 3. Instalar dependencias
CI=true pnpm install
cd server
CI=true pnpm install
cd ..

# 4. Compilar
pnpm build
cd server
pnpm build
cd ..
```

## Verificar que todo funciona

```bash
# Verificar backend
cd /home/webops/ReporteVentas/server
pnpm start
# Debería iniciar sin errores

# En otra terminal, verificar frontend
cd /home/webops/ReporteVentas
pnpm preview
# O servir con nginx/pm2
```

## Si sigues teniendo problemas

1. **Verifica que Node.js y pnpm estén instalados:**
   ```bash
   node --version
   pnpm --version
   ```

2. **Verifica permisos:**
   ```bash
   ls -la /home/webops/ReporteVentas/server/.env
   ls -la /home/webops/ReporteVentas/node_modules 2>/dev/null | head -5
   ```

3. **Revisa los logs de errores:**
   ```bash
   cd /home/webops/ReporteVentas/server
   pnpm build 2>&1 | head -50
   ```
