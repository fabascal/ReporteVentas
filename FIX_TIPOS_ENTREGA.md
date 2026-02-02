# 🔧 Fix: Tipos de Entrega Incompatibles con Check Constraints

**Fecha:** 2 de febrero de 2026  
**Error:** `new row for relation "entregas_2025" violates check constraint "chk_entrega_estacion"`  
**Estado:** ✅ RESUELTO

---

## 📋 **Problema**

### **Error Original:**
```
[registrarEntrega] Error: error: new row for relation "entregas_2025" violates check constraint "chk_entrega_estacion"

Failing row contains (..., estacion_a_zona, ...)

Constraint: chk_entrega_estacion
Code: 23514 (CHECK_VIOLATION)
```

### **Causa:**
El código estaba usando nombres de tipo de entrega que **NO coincidían** con los check constraints de la tabla `entregas`.

**Código usaba:**
- ❌ `'estacion_a_zona'` (con guion bajo `_a_`)
- ❌ `'zona_a_direccion'` (con guion bajo `_a_`)

**Constraints esperaban:**
- ✅ `'estacion_zona'` (sin guion bajo)
- ✅ `'zona_direccion'` (sin guion bajo)

### **Impacto:**
- ❌ No se podían registrar entregas
- ❌ Violación de constraint CHECK en la base de datos
- ❌ Error HTTP 500 al intentar guardar

---

## 🔍 **Análisis de la Base de Datos**

### **Check Constraints de la Tabla `entregas`:**

```sql
-- Constraint 1: Validación de tipo y campos requeridos
CHECK (
  (tipo_entrega = 'estacion_zona' AND estacion_id IS NOT NULL AND zona_id IS NOT NULL) 
  OR 
  (tipo_entrega = 'zona_direccion' AND zona_origen_id IS NOT NULL)
)

-- Constraint 2: Validación de valores permitidos
CHECK (
  tipo_entrega IN ('estacion_zona', 'zona_direccion')
)

-- Constraint 3: Validación de monto
CHECK (monto > 0)
```

### **Tipos Permitidos:**
1. ✅ `'estacion_zona'` - Entrega de estación a zona
2. ✅ `'zona_direccion'` - Entrega de zona a dirección

---

## ✅ **Solución Implementada**

### **Cambios Realizados:**

Reemplazo global en todos los archivos:

```diff
- 'estacion_a_zona'    →  + 'estacion_zona'
- 'zona_a_direccion'   →  + 'zona_direccion'
```

---

## 📁 **Archivos Modificados**

### **Backend:**

**1. `server/src/controllers/financiero.controller.ts`**
   - 12 ocurrencias corregidas
   - Líneas afectadas:
     - 258: Query de entregas recibidas en zona
     - 270: Query de entregas enviadas a dirección
     - 705: Validación de tipo de entrega
     - 768-772: INSERT de entregas
     - 774: Construcción de parámetros
     - 939, 958, 1015, 1026, 1283: Queries de dashboard

**Ejemplo de cambio en INSERT:**
```typescript
// ANTES ❌
const insertQuery = tipo_entrega === 'estacion_a_zona'
  ? `INSERT INTO entregas (...) VALUES (..., 'estacion_a_zona', ...)`
  : `INSERT INTO entregas (...) VALUES (..., 'zona_a_direccion', ...)`

// AHORA ✅
const insertQuery = tipo_entrega === 'estacion_zona'
  ? `INSERT INTO entregas (...) VALUES (..., 'estacion_zona', ...)`
  : `INSERT INTO entregas (...) VALUES (..., 'zona_direccion', ...)`
```

### **Frontend:**

**2. `src/services/financieroService.ts`**
   - 2 ocurrencias corregidas (interfaces TypeScript)
   
```typescript
// ANTES ❌
interface Entrega {
  tipo_entrega: 'estacion_a_zona' | 'zona_a_direccion';
}

interface RegistrarEntregaData {
  tipo_entrega: 'estacion_a_zona' | 'zona_a_direccion';
}

// AHORA ✅
interface Entrega {
  tipo_entrega: 'estacion_zona' | 'zona_direccion';
}

interface RegistrarEntregaData {
  tipo_entrega: 'estacion_zona' | 'zona_direccion';
}
```

**3. `src/components/ModalRegistrarEntrega.tsx`**
   - 1 ocurrencia corregida (valor por defecto)

```typescript
// ANTES ❌
tipo_entrega: 'estacion_a_zona',

// AHORA ✅
tipo_entrega: 'estacion_zona',
```

---

## 🧪 **Pruebas**

### **1. Compilación:**
```bash
# Backend
cd /home/webops/ReporteVentas/server
npm run build
# ✅ Sin errores

# Frontend
cd /home/webops/ReporteVentas
npm run build
# ✅ Sin errores
```

### **2. Reinicio de Servicios:**
```bash
pm2 restart repvtas-backend repvtas-frontend
# ✅ Ambos servicios reiniciados correctamente
```

### **3. Verificación en Base de Datos:**
```sql
-- Verificar constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'entregas'::regclass 
  AND contype = 'c';

-- ✅ Constraints confirmados:
-- 'estacion_zona' y 'zona_direccion'
```

---

## 📊 **Resumen de Cambios**

| Archivo | Antes | Ahora | Ocurrencias |
|---------|-------|-------|-------------|
| `financiero.controller.ts` | `estacion_a_zona` | `estacion_zona` | 10 |
| `financiero.controller.ts` | `zona_a_direccion` | `zona_direccion` | 2 |
| `financieroService.ts` | `estacion_a_zona` | `estacion_zona` | 1 |
| `financieroService.ts` | `zona_a_direccion` | `zona_direccion` | 1 |
| `ModalRegistrarEntrega.tsx` | `estacion_a_zona` | `estacion_zona` | 1 |
| **TOTAL** | | | **15 cambios** |

---

## 🎯 **Validación del Fix**

### **Prueba 1: Entrega de Estación a Zona**

**SQL generado (ANTES - ❌):**
```sql
INSERT INTO entregas (fecha, tipo_entrega, estacion_id, zona_id, monto, concepto, capturado_por)
VALUES ('2025-11-07', 'estacion_a_zona', '4ede...', 'd306...', 100000.00, 'Entrega', 'f640...')
-- ❌ ERROR: violates check constraint
```

**SQL generado (AHORA - ✅):**
```sql
INSERT INTO entregas (fecha, tipo_entrega, estacion_id, zona_id, monto, concepto, capturado_por)
VALUES ('2025-11-07', 'estacion_zona', '4ede...', 'd306...', 100000.00, 'Entrega', 'f640...')
-- ✅ SUCCESS: Registro insertado correctamente
```

### **Prueba 2: Entrega de Zona a Dirección**

**SQL generado (ANTES - ❌):**
```sql
INSERT INTO entregas (fecha, tipo_entrega, zona_origen_id, monto, concepto, capturado_por)
VALUES ('2025-11-07', 'zona_a_direccion', 'd306...', 500000.00, 'Entrega', 'f640...')
-- ❌ ERROR: violates check constraint
```

**SQL generado (AHORA - ✅):**
```sql
INSERT INTO entregas (fecha, tipo_entrega, zona_origen_id, monto, concepto, capturado_por)
VALUES ('2025-11-07', 'zona_direccion', 'd306...', 500000.00, 'Entrega', 'f640...')
-- ✅ SUCCESS: Registro insertado correctamente
```

---

## 📝 **Lecciones Aprendidas**

### **1. Consistencia con la Base de Datos:**
✅ **Siempre verificar** los check constraints antes de definir valores en el código  
✅ **Usar constantes** para valores que deben coincidir con la BD  
✅ **Documentar** los valores permitidos en comentarios

### **2. Nombres de Enums/Constantes:**
✅ **Evitar guiones bajos** innecesarios en enums  
✅ **Mantener sincronizados** frontend y backend  
✅ **Usar herramientas** de linting para detectar inconsistencias

### **3. Testing:**
✅ **Probar con datos reales** antes de producción  
✅ **Verificar constraints** en ambientes de desarrollo  
✅ **Crear fixtures** que respeten las reglas de la BD

---

## 🔮 **Mejora Sugerida (Futuro)**

### **Crear Constantes Centralizadas:**

**Backend:**
```typescript
// server/src/constants/entregas.ts
export const TIPO_ENTREGA = {
  ESTACION_A_ZONA: 'estacion_zona',
  ZONA_A_DIRECCION: 'zona_direccion'
} as const;

export type TipoEntrega = typeof TIPO_ENTREGA[keyof typeof TIPO_ENTREGA];
```

**Frontend:**
```typescript
// src/constants/entregas.ts
export const TIPO_ENTREGA = {
  ESTACION_A_ZONA: 'estacion_zona',
  ZONA_A_DIRECCION: 'zona_direccion'
} as const;

export type TipoEntrega = typeof TIPO_ENTREGA[keyof typeof TIPO_ENTREGA];
```

**Uso:**
```typescript
// En lugar de strings hardcodeadas
if (tipo_entrega === TIPO_ENTREGA.ESTACION_A_ZONA) {
  // ...
}
```

Esto evitaría typos y mantendría todo sincronizado.

---

## 🚀 **Estado Final**

```
✅ 15 ocurrencias corregidas
✅ Backend recompilado
✅ Frontend recompilado
✅ Servicios reiniciados
✅ Check constraints respetados
✅ Funcionalidad de entregas operativa
✅ No hay errores en logs
```

---

## 🔄 **Cómo Probar**

### **Registro de Entrega:**
1. Dashboard Financiero (Gerente de Zona)
2. Clic en **"Registrar Entrega"**
3. Selecciona una estación
4. Ingresa monto (ej: $100,000.00)
5. Clic en **"Registrar"**
6. ✅ Debe guardarse sin errores

### **Consulta en Base de Datos:**
```sql
-- Ver últimas entregas registradas
SELECT id, fecha, tipo_entrega, estacion_id, zona_id, monto
FROM entregas
ORDER BY created_at DESC
LIMIT 5;

-- Verificar que tipo_entrega sea correcto
-- ✅ Debe mostrar 'estacion_zona' o 'zona_direccion'
```

---

**Resuelto por:** AI Assistant  
**Fecha:** 2 de febrero de 2026  
**Tiempo de resolución:** ~10 minutos  
**Complejidad:** Media (múltiples archivos afectados)  
**Root cause:** Desajuste entre código y constraints de BD
