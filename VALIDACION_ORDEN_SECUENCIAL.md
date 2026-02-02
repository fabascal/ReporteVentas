# Validación de Orden Secuencial de Reportes

## 📋 Descripción

Se ha implementado una validación de orden secuencial para asegurar que los reportes se aprueben en orden cronológico dentro de cada mes.

## 🎯 Regla de Negocio

**No se puede aprobar el día N sin haber aprobado primero todos los días anteriores (1 a N-1) del mismo mes.**

### Ejemplo:

- ✅ **Permitido**: Aprobar día 1, luego día 2, luego día 3...
- ❌ **Bloqueado**: Aprobar día 5 cuando el día 3 aún está pendiente
- ❌ **Bloqueado**: Aprobar día 10 cuando hay días del 1-9 sin aprobar

## 🔒 Niveles de Validación

### 1. **Gerente de Estación** (Pendiente → EnRevision)
Cuando intenta enviar un reporte a revisión:
- El sistema verifica que todos los días anteriores del mismo mes estén **Aprobados**
- Si hay días pendientes o rechazados, muestra un mensaje claro con las fechas faltantes
- El reporte no puede avanzar hasta que se complete el orden

### 2. **Gerente de Zona** (EnRevision → Aprobado)
Cuando intenta aprobar un reporte:
- El sistema verifica que todos los días anteriores del mismo mes estén **Aprobados**
- Si hay días sin aprobar, bloquea la aprobación
- Muestra las fechas que deben aprobarse primero

## 📊 Validación por Estación y Mes

La validación se aplica:
- **Por estación**: Cada estación tiene su propio flujo de aprobación
- **Por mes**: Los días se validan dentro del mismo año y mes
- **Independiente entre meses**: Enero no afecta Febrero, cada mes inicia de cero

## 💡 Mensajes de Error

### Ejemplo de mensaje bloqueado:
```
No puedes enviar este reporte a revisión. 
Primero debes aprobar los días anteriores del mes: 1/11 (Pendiente), 2/11 (Rechazado), 3/11 (Pendiente)
```

El mensaje indica:
- Qué días faltan
- El estado actual de cada día faltante
- Formato: `DÍA/MES (ESTADO)`

## ⚙️ Implementación Técnica

### Backend
**Archivo**: `/server/src/controllers/reportes.controller.ts`
**Función**: `updateEstado()`

**Validación para Gerente de Estación (línea ~731)**:
```typescript
// Cuando estado === EstadoReporte.EnRevision
// Verifica días anteriores con estado != 'Aprobado'
```

**Validación para Gerente de Zona (línea ~798)**:
```typescript
// Cuando estado === EstadoReporte.Aprobado
// Verifica días anteriores con estado != 'Aprobado'
```

### Query SQL utilizado:
```sql
SELECT DATE(fecha) as fecha, estado
FROM reportes
WHERE estacion_id = $1
  AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM $2::date)
  AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM $2::date)
  AND DATE(fecha) < $2::date
  AND estado != 'Aprobado'
ORDER BY fecha
```

## 🔄 Flujo Completo

```
┌─────────────┐
│   DÍA 1     │ Pendiente
└─────────────┘
      ↓ Gerente Estación aprueba (✓ Sin validación, es el primero)
┌─────────────┐
│   DÍA 1     │ EnRevision
└─────────────┘
      ↓ Gerente Zona aprueba (✓ Sin validación, es el primero)
┌─────────────┐
│   DÍA 1     │ Aprobado ✅
└─────────────┘

┌─────────────┐
│   DÍA 2     │ Pendiente
└─────────────┘
      ↓ Gerente Estación aprueba (✓ Día 1 está aprobado)
┌─────────────┐
│   DÍA 2     │ EnRevision
└─────────────┘
      ↓ Gerente Zona aprueba (✓ Día 1 está aprobado)
┌─────────────┐
│   DÍA 2     │ Aprobado ✅
└─────────────┘

┌─────────────┐
│   DÍA 5     │ Pendiente
└─────────────┘
      ↓ Gerente Estación intenta aprobar
      ✗ BLOQUEADO: Días 3 y 4 no están aprobados
      Mensaje: "Primero debes aprobar: 3/11 (Pendiente), 4/11 (Pendiente)"
```

## 🎨 Consideraciones UX

1. **Mensajes Claros**: Los mensajes de error son específicos y accionables
2. **Formato Legible**: Las fechas se muestran en formato DD/MM
3. **Estado Visible**: Se indica el estado actual de cada día pendiente
4. **Orden Lógico**: Los días faltantes se muestran ordenados cronológicamente

## 🚀 Ventajas

1. ✅ **Integridad de Datos**: Asegura que no haya "huecos" en los reportes mensuales
2. ✅ **Control de Calidad**: Fuerza la revisión secuencial
3. ✅ **Cierre Mensual Confiable**: El sistema de cierre puede confiar en que todos los días están completos
4. ✅ **Auditoría**: Facilita el seguimiento cronológico
5. ✅ **Prevención de Errores**: Evita aprobaciones fuera de orden que podrían causar inconsistencias

## 📝 Notas Adicionales

- Los **administradores** no tienen esta restricción (pueden aprobar cualquier día)
- Los días **rechazados** también bloquean los días siguientes (deben ser corregidos primero)
- La validación se aplica **solo en el mismo mes y año**
- Cada **estación es independiente** (la estación A no afecta a la estación B)

## 🔧 Mantenimiento

Si necesitas modificar esta validación:
1. Edita `/server/src/controllers/reportes.controller.ts`
2. Busca los comentarios `VALIDACIÓN DE ORDEN SECUENCIAL`
3. Ajusta la lógica según necesidades
4. Recompila el backend: `npm run build`
5. Reinicia PM2: `pm2 restart repvtas-backend`

---

**Fecha de implementación**: 2026-01-12
**Autor**: Sistema de Reportes de Ventas
