# 🔧 Corrección: Reportes Vtas y RVtas para Gerente de Zona

**Fecha:** 2 de febrero de 2026  
**Versión:** 1.1

---

## 🐛 Problema Detectado

Los reportes **Vtas** (ReporteVtas.tsx) y **RVtas** (ReporteEficiencia.tsx) **no funcionaban** para el Gerente de Zona.

### **Causa Raíz:**

El endpoint `/api/estaciones` estaba buscando en la tabla `user_zonas`:

```typescript
// ANTES (INCORRECTO)
} else if (req.user.role === 'GerenteZona') {
  query += ` AND e.zona_id IN (
    SELECT zona_id FROM user_zonas WHERE user_id = $${paramCount}
  )`
  params.push(req.user.id)
}
```

**Problema:** El Gerente de Zona **NO tiene** registros en `user_zonas`. Su zona está directamente en `users.zona_id`.

---

## ✅ Solución Implementada

### **Corrección en Backend:**

Archivo: `/home/webops/ReporteVentas/server/src/controllers/estaciones.controller.ts`

```typescript
// DESPUÉS (CORRECTO)
} else if (req.user.role === 'GerenteZona') {
  // Gerente de zona ve estaciones de su zona asignada (users.zona_id)
  query += ` AND e.zona_id = (
    SELECT zona_id FROM users WHERE id = $${paramCount}
  )`
  params.push(req.user.id)
}
```

---

## 📊 Verificación

### **Gerentes de Zona Activos:**

```sql
SELECT 
  u.name as gerente,
  z.nombre as zona,
  COUNT(e.id) as estaciones
FROM users u
LEFT JOIN zonas z ON z.id = u.zona_id
LEFT JOIN estaciones e ON e.zona_id = u.zona_id
WHERE u.role = 'GerenteZona'
GROUP BY u.id, u.name, z.nombre
ORDER BY z.nombre;
```

**Resultado:**
```
     gerente      |      zona      | estaciones 
------------------+----------------+------------
 Gerente Zona     | Zona Bajio     |         29
 Torson           | Zona Occidente |         22
 Gerente Zona Sur | Zona Sur       |         26
```

---

## 🧪 Pruebas

### **Antes de la Corrección:**
```
Gerente Zona Sur (login) → Reportes Vtas
  ✗ No muestra estaciones
  ✗ Dropdown vacío
  ✗ No puede generar reportes
```

### **Después de la Corrección:**
```
Gerente Zona Sur (login) → Reportes Vtas
  ✓ Muestra 26 estaciones de Zona Sur
  ✓ Dropdown con todas las estaciones
  ✓ Puede seleccionar y generar reportes
```

---

## 📁 Archivos Modificados

### **Backend:**

1. **`server/src/controllers/estaciones.controller.ts`**
   - Línea 38-43: Corrección de consulta SQL para filtrar estaciones

2. **`server/src/controllers/reportes.controller.ts`**
   - Línea 250-252: Corrección de consulta SQL para filtrar reportes
   - **Cambio:** `user_zonas` → `users.zona_id`

### **Compilación:**
```bash
cd /home/webops/ReporteVentas/server
npm run build
pm2 restart repvtas-backend
```

---

## 🎯 Reportes Afectados (Ahora Corregidos)

1. **Vtas** (`/reporte-vtas`)
   - Reporte mensual detallado por producto
   - Ahora funciona para Gerente de Zona

2. **RVtas** (`/reporte-eficiencia`)
   - Reporte de eficiencia mensual
   - Ahora funciona para Gerente de Zona

---

## 📝 Estructura de Permisos

### **Gerente de Estación:**
```
users.id → user_estaciones.user_id
                 ↓
         estaciones (solo asignadas)
```

**Ve:** Solo sus estaciones asignadas en `user_estaciones`

---

### **Gerente de Zona:**
```
users.id → users.zona_id → estaciones.zona_id
                 ↓
         todas las estaciones de su zona
```

**Ve:** Todas las estaciones donde `estaciones.zona_id = users.zona_id`

---

### **Administrador / Dirección:**
```
users.id (sin filtros)
    ↓
todas las estaciones
```

**Ve:** Todas las estaciones sin restricción

---

## 🔍 Consulta SQL Corregida

### **Completa:**
```sql
SELECT 
  e.id,
  e.nombre,
  e.activa,
  e.zona_id,
  e.identificador_externo,
  e.tiene_premium,
  e.tiene_magna,
  e.tiene_diesel,
  z.nombre as zona_nombre,
  z.id as zona_id
FROM estaciones e
JOIN zonas z ON e.zona_id = z.id
WHERE 1=1
  -- Filtro para Gerente de Estación
  AND (
    -- Si es Gerente Estación: solo sus estaciones
    ('GerenteEstacion' = $role AND e.id IN (
      SELECT estacion_id FROM user_estaciones WHERE user_id = $user_id
    ))
    OR
    -- Si es Gerente Zona: todas las estaciones de su zona
    ('GerenteZona' = $role AND e.zona_id = (
      SELECT zona_id FROM users WHERE id = $user_id
    ))
    OR
    -- Si es Admin/Dirección: todas
    $role IN ('Administrador', 'Direccion')
  )
ORDER BY z.nombre, e.nombre;
```

---

## 🔧 Segunda Corrección: Filtro de Reportes

### **Problema:**
Aunque el Gerente de Zona ya podía ver las **estaciones**, no podía ver los **reportes** de esas estaciones porque el mismo error existía en `reportes.controller.ts`.

### **Solución:**

**Archivo:** `server/src/controllers/reportes.controller.ts`

```typescript
// ANTES (❌ Incorrecto)
const filterClause = ` AND r.estado = ANY($${paramCount}::text[]) AND e.zona_id IN (
  SELECT zona_id FROM user_zonas WHERE user_id = $${paramCount + 1}
)`

// AHORA (✅ Correcto)
const filterClause = ` AND r.estado = ANY($${paramCount}::text[]) AND e.zona_id = (
  SELECT zona_id FROM users WHERE id = $${paramCount + 1}
)`
```

**Resultado:**
- ✅ Ahora los reportes también se filtran correctamente
- ✅ El Gerente de Zona puede ver reportes de AUTLAN enero 2026
- ✅ Muestra los días 1 y 2 que están aprobados

---

## ✅ Resultado

**Estado:** ✅ Corregido y funcionando

**Verificado:**
- ✅ Gerente Zona Bajio puede ver reportes (29 estaciones)
- ✅ Gerente Zona Occidente puede ver reportes (22 estaciones)
- ✅ Gerente Zona Sur puede ver reportes (26 estaciones)
- ✅ Gerente Estación sigue funcionando (solo sus estaciones)
- ✅ Administrador sigue funcionando (todas las estaciones)

---

## 📞 Soporte

Si un Gerente de Zona aún no puede ver reportes:

### **1. Verificar asignación de zona:**
```sql
SELECT id, name, role, zona_id 
FROM users 
WHERE id = 'user_id_here';
```

### **2. Verificar estaciones de la zona:**
```sql
SELECT COUNT(*) 
FROM estaciones 
WHERE zona_id = (SELECT zona_id FROM users WHERE id = 'user_id_here');
```

### **3. Verificar logs:**
```bash
tail -50 /home/webops/ReporteVentas/logs/backend-error.log | grep estaciones
```

---

**Última actualización:** 2 de febrero de 2026 02:20 AM  
**Aplicado en:** Backend v1.2  
**Estado:** Producción ✅  
**Correcciones:** 2 (estaciones.controller + reportes.controller)
