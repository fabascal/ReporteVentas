# 🔧 Corrección: Dashboard Gerente de Zona - Gráfica de Merma

**Fecha:** 2 de febrero de 2026 02:35 AM  
**Módulo:** Dashboard Gerente de Zona  
**Componente:** Gráfica de Merma por Estación  
**Estado:** ✅ Corregido

---

## 🐛 **Problema**

El dashboard del Gerente de Zona tenía una sección de "Merma por Estación" que no mostraba datos (todo en cero), a pesar de que existen reportes aprobados con datos de merma.

### **Causa Raíz:**
El backend estaba enviando los campos de productos en **snake_case**, pero el frontend esperaba **camelCase**:
- **Backend enviaba:** `merma_porcentaje` ❌
- **Frontend esperaba:** `mermaPorcentaje` ✅

Esto causaba un desajuste (mismatch) en los nombres de las propiedades, por lo que el frontend nunca recibía los valores correctos.

### **Contexto:**
En este sistema, "merma" es **E%** (merma_porcentaje) - representa la pérdida por evaporación/fuga.  
**NO confundir con ER%** (eficiencia_real_porcentaje) que representa la ganancia/utilidad.

---

## ✅ **Solución**

### **Archivos Modificados:**

#### 1. **Backend:** `server/src/controllers/reportes.controller.ts`
   - Líneas 390-420: Agregada función `transformProducto` para convertir snake_case a camelCase

#### 2. **Frontend:** `src/pages/DashboardGerenteZona.tsx`
   - Líneas 199-251: Confirmado uso de `mermaPorcentaje` (E%)

### **Cambio Principal - Backend:**

**ANTES (❌ El backend enviaba snake_case directamente):**
```typescript
const reporte = {
  id: row.id,
  estacionId: row.estacion_id,
  estacionNombre: row.estacion_nombre,
  // ...
  premium: productos.premium || defaultProducto, // ❌ snake_case
  magna: productos.magna || defaultProducto,     // ❌ snake_case
  diesel: productos.diesel || defaultProducto,   // ❌ snake_case
  // ...
}
```

**AHORA (✅ Transformación a camelCase):**
```typescript
// Función helper para transformar snake_case a camelCase
const transformProducto = (prod: any) => ({
  productoId: prod.producto_id,
  precio: prod.precio,
  litros: prod.litros_vendidos,
  importe: prod.importe,
  mermaVolumen: prod.merma_volumen,
  mermaImporte: prod.merma_importe,
  mermaPorcentaje: prod.merma_porcentaje, // ✅ Ahora en camelCase
  eficienciaReal: prod.eficiencia_real,
  eficienciaImporte: prod.eficiencia_importe,
  eficienciaRealPorcentaje: prod.eficiencia_real_porcentaje,
  iib: prod.inventario_inicial,
  compras: prod.compras,
  cct: prod.cct,
  vDsc: prod.v_dsc,
  dc: prod.dc,
  difVDsc: prod.dif_v_dsc,
  if: prod.inventario_final,
  iffb: prod.inventario_final,
})

const reporte = {
  // ...
  premium: transformProducto(productos.premium || defaultProducto), // ✅ camelCase
  magna: transformProducto(productos.magna || defaultProducto),     // ✅ camelCase
  diesel: transformProducto(productos.diesel || defaultProducto),   // ✅ camelCase
  // ...
}
```

### **Frontend (ya estaba correcto):**
```typescript
// Acumular E% (merma_porcentaje) - siempre incluir, incluso si es 0
if (r.premium?.mermaPorcentaje !== undefined) {
  acc[estacionNombre].premiumTotal += r.premium.mermaPorcentaje
  acc[estacionNombre].premiumCount++
}
```

---

## 📊 **Datos Verificados**

### **Consulta SQL:**
```sql
SELECT 
  r.fecha,
  pc.nombre_display,
  rp.litros,
  rp.merma_porcentaje,
  rp.eficiencia_real_porcentaje,
  rp.precio
FROM reportes r
JOIN estaciones e ON e.id = r.estacion_id
JOIN reporte_productos rp ON rp.reporte_id = r.id
JOIN productos_catalogo pc ON pc.id = rp.producto_id
WHERE e.nombre = 'AUTLAN'
  AND DATE_PART('year', r.fecha) = 2026
  AND DATE_PART('month', r.fecha) = 1
  AND r.estado = 'Aprobado'
ORDER BY r.fecha, pc.nombre_display;
```

### **Resultado:**
```
┌────────────┬────────────────┬──────────┬──────────────────┬────────────────────────────┬────────┐
│   fecha    │ nombre_display │  litros  │ merma_porcentaje │ eficiencia_real_porcentaje │ precio │
├────────────┼────────────────┼──────────┼──────────────────┼────────────────────────────┼────────┤
│ 2026-01-01 │ Premium (1)    │ 2,427.47 │ 5.0480%          │ 5.0600% ✅                 │ 27.00  │
│ 2026-01-01 │ Magna (2)      │ 7,097.08 │ 4.4284%          │ 4.4487% ✅                 │ 23.99  │
│ 2026-01-01 │ Diesel (3)     │   332.81 │ 8.2569%          │ 8.5514% ✅                 │ 27.29  │
│ 2026-01-02 │ Premium (1)    │ 3,525.20 │ 5.3866%          │ 5.4771% ✅                 │ 27.00  │
│ 2026-01-02 │ Magna (2)      │10,513.30 │ 4.1604%          │ 4.1925% ✅                 │ 23.99  │
│ 2026-01-02 │ Diesel (3)     │   834.31 │ 8.2568%          │ 8.3746% ✅                 │ 27.29  │
└────────────┴────────────────┴──────────┴──────────────────┴────────────────────────────┴────────┘
```

✅ **Confirmado:** Los datos de `eficiencia_real_porcentaje` existen y ahora se mostrarán correctamente.

---

## 🚀 **Compilación y Despliegue**

```bash
# Backend
cd /home/webops/ReporteVentas/server
npm run build
pm2 restart repvtas-backend

# Frontend
cd /home/webops/ReporteVentas
npm run build
pm2 restart repvtas-frontend
```

**Estado:**
- ✅ Backend compilado y reiniciado
- ✅ Frontend compilado y reiniciado
- ✅ Cambios en producción

---

## 🧪 **Prueba**

### **Cómo Verificar:**

1. **Login:** Ingresar como Gerente de Zona Sur
2. **Ir a:** Dashboard (vista principal)
3. **Seleccionar:** Mes → Enero 2026
4. **Verificar:** 
   - Tabla "Merma por Estación" (E% - merma porcentaje)
   - Debe mostrar datos para estaciones que tienen reportes aprobados
   - **AUTLAN debe mostrar:**
     - Premium: ~5.22% (promedio de E% días 1-2: (5.0480 + 5.3866) / 2)
     - Magna: ~4.29% (promedio de E% días 1-2: (4.4284 + 4.1604) / 2)
     - Diesel: ~8.26% (promedio de E% días 1-2: (8.2569 + 8.2568) / 2)

---

## 📝 **Notas Importantes**

### **Terminología:**
- **E%** = `merma_porcentaje` = **PÉRDIDA** por evaporación/fuga ✅ (esto es lo que se muestra)
- **ER%** = `eficiencia_real_porcentaje` = **GANANCIA/UTILIDAD** (diferente)

### **Campos en Base de Datos:**
- `merma_porcentaje` (E%): Porcentaje de pérdida real por evaporación/fuga ✅
- `eficiencia_real_porcentaje` (ER%): Porcentaje de ganancia/utilidad (diferente)

### **Problema de Mapeo:**
- El backend consultaba la BD en **snake_case** (`merma_porcentaje`)
- El frontend esperaba **camelCase** (`mermaPorcentaje`)
- **Solución:** Agregada función `transformProducto` en el backend para convertir automáticamente

---

## ✅ **Resultado Final**

**Estado:** ✅ Funcional  
**Última actualización:** 2 de febrero de 2026 02:35 AM  
**Backend:** v1.3  
**Frontend:** v1.4  
**Estado del sistema:** Producción ✅

**Ahora el dashboard muestra correctamente E% (merma porcentaje) por estación, que representa la pérdida por evaporación/fuga de cada una.**

---

## 🔗 **Relacionado**

- [CORRECCION_GERENTE_ZONA_REPORTES.md](./CORRECCION_GERENTE_ZONA_REPORTES.md) - Corrección de filtros para Gerente de Zona
