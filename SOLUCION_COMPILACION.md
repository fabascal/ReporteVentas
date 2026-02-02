# 🔧 Solución al Error de Compilación

## Error encontrado

```
error TS2688: Cannot find type definition file for 'node'.
```

## Causa

1. Las dependencias del backend no están instaladas (`node_modules` no existe en `server/`)
2. El archivo `node_modules/.bin` en la raíz tiene permisos de root y bloquea las instalaciones

## Solución Rápida

Ejecuta este comando para limpiar e instalar todo:

```bash
cd /home/webops/ReporteVentas
sudo bash clean-and-install.sh
```

## Solución Manual

Si prefieres hacerlo paso a paso:

```bash
cd /home/webops/ReporteVentas

# 1. Limpiar node_modules problemáticos (requiere sudo)
sudo rm -rf node_modules/.bin
sudo rm -rf node_modules  # Si todo está con permisos incorrectos
sudo rm -rf server/node_modules

# 2. Instalar dependencias del frontend
CI=true pnpm install

# 3. Instalar dependencias del backend
cd server
CI=true pnpm install

# 4. Verificar que @types/node esté instalado
ls -la node_modules/@types/node

# 5. Si falta, instalarlo
CI=true pnpm add -D @types/node

# 6. Compilar
pnpm build
```

## Cambios Realizados

1. ✅ Se removió `"types": ["node"]` del `tsconfig.json` para evitar el error si no está instalado
2. ✅ Se creó script `clean-and-install.sh` para automatizar la limpieza e instalación

## Después de Instalar

Una vez que las dependencias estén instaladas, puedes compilar:

```bash
cd /home/webops/ReporteVentas
bash deploy.sh
```

O solo el backend:

```bash
cd /home/webops/ReporteVentas/server
pnpm build
```
