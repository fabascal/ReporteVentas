# 💼 Cierre Contable por Zona

## 🎯 Concepto Principal

El **cierre contable** funciona de manera **independiente por zona**, similar al cierre operativo. Cada **Gerente de Zona** cierra únicamente las estaciones de su zona asignada.

---

## 📊 Estructura del Sistema

```
┌─────────────────────────────────────────┐
│         SISTEMA COMPLETO                │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────┐      ┌────────────┐   │
│  │ Zona Sur   │      │ Zona Occ   │   │
│  ├────────────┤      ├────────────┤   │
│  │ Gerente 1  │      │ Gerente 2  │   │
│  │            │      │            │   │
│  │ • AUTLAN   │      │ • IXTLAN 1 │   │
│  │ • SAYULA2  │      │ • JAMAY    │   │
│  │ • CAPRICHO │      │ • EJIDO    │   │
│  │ ... (26)   │      │ ... (22)   │   │
│  └────────────┘      └────────────┘   │
│       ↓                    ↓           │
│  Cierre             Cierre             │
│  Independiente      Independiente      │
└─────────────────────────────────────────┘
```

---

## 🔄 Flujo del Cierre Contable

### **Fase 1: Operaciones Diarias**
```
Enero 2026 - Zona Sur

AUTLAN:
  Día 1:  Merma $15,000 ✓ Aprobado
  Día 2:  Merma $18,500 ✓ Aprobado
  ...
  Día 31: Merma $21,000 ✓ Aprobado
  
SAYULA2:
  Día 1:  Merma $12,000 ✓ Aprobado
  Día 2:  Merma $14,200 ✓ Aprobado
  ...
```

### **Fase 2: Entregas y Gastos**
```
Gerente Zona Sur registra:
  
  Entregas de AUTLAN:
    • 15 enero: $200,000
    • 31 enero: $343,904
    
  Entregas de SAYULA2:
    • 20 enero: $150,000
    • 31 enero: $200,000
    
  Gastos de Zona Sur:
    • Mantenimiento: $5,000
    • Combustible: $3,000
```

### **Fase 3: Cierre Operativo**
```
31 enero - Gerente Zona Sur
  
  → Cierra período operativo
  → Afecta SOLO estaciones de Zona Sur
  → Bloquea captura de reportes Zona Sur
  
Zona Occidente sigue independiente
```

### **Fase 4: Cierre Contable**
```
31 enero o posterior - Gerente Zona Sur

VALIDACIÓN:
  ✓ Período operativo cerrado
  ✓ AUTLAN: Saldo $0.00 ✓
  ✓ SAYULA2: Saldo $0.00 ✓
  ✓ CAPRICHO: Saldo $0.00 ✓
  ... todas las 26 estaciones

SI TODAS EN $0:
  → Calcula saldo final Zona Sur
  → Registra en liquidaciones_mensuales
  → Bloquea gastos/entregas Zona Sur
  → Saldo final → Saldo inicial febrero

Zona Occidente NO SE AFECTA
```

---

## 🔐 Validaciones por Zona

### **Backend (`cerrarPeriodoContable`)**

```typescript
// 1. Obtener zona del usuario autenticado
const usuarioResult = await pool.query(
  `SELECT zona_id FROM users WHERE id = $1`,
  [usuario.id]
);
const zona_id = usuarioResult.rows[0]?.zona_id;

// 2. Obtener SOLO estaciones de esta zona
const estacionesResult = await pool.query(`
  SELECT ... 
  FROM estaciones e
  WHERE e.zona_id = $1 AND e.activa = true
  ...
`, [zona_id, fecha_inicio, fecha_fin]);

// 3. Validar SOLO estaciones de esta zona
const estacionesPendientes = estacionesResult.rows.filter(
  est => merma > 0 && saldo !== 0
);

// 4. Registrar liquidación SOLO para esta zona
INSERT INTO liquidaciones_mensuales (zona_id, ...)
VALUES ($1, ...);
```

**Resultado:** Cada gerente solo ve y cierra su zona.

---

## 📅 Ejemplo Completo: Enero 2026

### **Zona Sur (26 estaciones)**

| Fecha | Acción | Gerente | Resultado |
|-------|--------|---------|-----------|
| 31 enero | Cierre Operativo | Gerente Zona Sur | ✓ Reportes cerrados |
| 31 enero | Liquidación | Gerente Zona Sur | ✓ Período liquidado |
| Estado | - | - | Zona Sur cerrada ✓ |

**Liquidación registrada:**
```
zona_id: "abc123..." (Zona Sur)
mes: 1
anio: 2026
saldo_inicial: $50,000
entregas_recibidas: $543,904
entregas_direccion: $500,000
gastos_zona: $8,000
saldo_final: $85,904
estado: 'cerrado'
```

---

### **Zona Occidente (22 estaciones)**

| Fecha | Acción | Gerente | Resultado |
|-------|--------|---------|-----------|
| 5 febrero | Cierre Operativo | Gerente Zona Occ | ✓ Reportes cerrados |
| 8 febrero | Liquidación | Gerente Zona Occ | ✓ Período liquidado |
| Estado | - | - | Zona Occ cerrada ✓ |

**Liquidación registrada:**
```
zona_id: "def456..." (Zona Occidente)
mes: 1
anio: 2026
saldo_inicial: $30,000
entregas_recibidas: $890,000
entregas_direccion: $850,000
gastos_zona: $12,000
saldo_final: $58,000
estado: 'cerrado'
```

---

## 🔍 Consultas por Zona

### **Ver liquidaciones de una zona específica:**
```sql
SELECT 
    z.nombre as zona,
    lm.mes,
    lm.anio,
    lm.saldo_inicial,
    lm.entregas_realizadas,
    lm.gastos_realizados,
    lm.saldo_final,
    lm.estado,
    lm.fecha_cierre
FROM liquidaciones_mensuales lm
JOIN zonas z ON z.id = lm.zona_id
WHERE lm.zona_id = 'abc123...'  -- ID de Zona Sur
  AND lm.anio = 2026
ORDER BY lm.mes;
```

### **Ver todas las zonas y su estado de liquidación:**
```sql
SELECT 
    z.nombre as zona,
    COUNT(CASE WHEN lm.estado = 'cerrado' THEN 1 END) as meses_cerrados,
    COUNT(CASE WHEN lm.estado = 'reabierto' THEN 1 END) as meses_reabiertos,
    MAX(lm.fecha_cierre) as ultimo_cierre
FROM zonas z
LEFT JOIN liquidaciones_mensuales lm ON lm.zona_id = z.id
WHERE z.activa = true
  AND lm.anio = 2026
GROUP BY z.id, z.nombre
ORDER BY z.nombre;
```

### **Ver estaciones liquidadas por zona y mes:**
```sql
SELECT 
    z.nombre as zona,
    e.nombre as estacion,
    lm.mes,
    lm.anio,
    lm.merma_generada,
    lm.entregas_realizadas,
    lm.gastos_realizados,
    lm.saldo_final,
    lm.estado
FROM liquidaciones_mensuales lm
JOIN estaciones e ON e.id = lm.estacion_id
JOIN zonas z ON z.id = e.zona_id
WHERE z.id = 'abc123...'  -- ID de Zona Sur
  AND lm.anio = 2026
  AND lm.mes = 1
ORDER BY e.nombre;
```

---

## 🚫 Restricciones Independientes

### **Después de liquidar Zona Sur (enero):**

✅ **Zona Sur:**
- ❌ No puede registrar gastos de enero
- ❌ No puede registrar entregas de enero
- ✅ Puede operar febrero normalmente

✅ **Zona Occidente:**
- ✅ Puede registrar gastos de enero
- ✅ Puede registrar entregas de enero
- ✅ Puede cerrar cuando esté lista

**No hay dependencia entre zonas.**

---

## 📊 Dashboard por Gerente de Zona

### **Gerente Zona Sur ve:**
```
Control Financiero - Resguardos
Enero 2026

Zona Sur                        [Liquidar Período]

Saldo Inicial:        $50,000.00
Entregas Recibidas:  $543,904.03
Entregas a Dirección: $500,000.00
Gastos de Zona:        $8,000.00
Resguardo en Zona:    $85,904.03
Pendiente Estaciones:     $0.00

Estaciones de la Zona (26)
┌──────────┬────────┬──────────┬────────┬────────┬────────────┐
│ Estación │ Merma  │ Entregas │ Gastos │ Saldo  │ Estado     │
├──────────┼────────┼──────────┼────────┼────────┼────────────┤
│ AUTLAN   │ $543K  │ $543K    │ $0     │ $0     │ Liquidado  │
│ SAYULA2  │ $350K  │ $350K    │ $0     │ $0     │ Liquidado  │
│ ...      │ ...    │ ...      │ ...    │ ...    │ ...        │
└──────────┴────────┴──────────┴────────┴────────┴────────────┘

Estado: ✓ Listo para Liquidar
```

### **Gerente Zona Occidente ve (su propia zona):**
```
Control Financiero - Resguardos
Enero 2026

Zona Occidente                  [Liquidar Período]

Saldo Inicial:        $30,000.00
Entregas Recibidas:  $200,000.00
Entregas a Dirección: $150,000.00
Gastos de Zona:       $12,000.00
Resguardo en Zona:    $68,000.00
Pendiente Estaciones: $450,000.00

Estaciones de la Zona (22)
┌──────────┬────────┬──────────┬────────┬────────┬────────────┐
│ Estación │ Merma  │ Entregas │ Gastos │ Saldo  │ Estado     │
├──────────┼────────┼──────────┼────────┼────────┼────────────┤
│ IXTLAN 1 │ $250K  │ $0       │ $0     │ $250K  │ En Proceso │
│ JAMAY    │ $180K  │ $100K    │ $0     │ $80K   │ Parcial    │
│ ...      │ ...    │ ...      │ ...    │ ...    │ ...        │
└──────────┴────────┴──────────┴────────┴────────┴────────────┘

Estado: ✗ No se puede liquidar (estaciones pendientes)
```

**Cada gerente opera independientemente.**

---

## 🔓 Reapertura por Zona

Si el Gerente de Zona Sur necesita corregir:

```sql
POST /api/financiero/liquidacion/reabrir
{
  "mes": 1,
  "anio": 2026,
  "motivo": "Corrección en entregas de AUTLAN"
}
```

**Resultado:**
- ✓ Reabre liquidación Zona Sur
- ✓ Permite modificaciones en Zona Sur
- ❌ NO afecta Zona Occidente

---

## 📈 Reportes Consolidados (Dirección)

La dirección puede ver todas las zonas:

```sql
SELECT 
    z.nombre as zona,
    lm.mes,
    lm.anio,
    lm.saldo_inicial,
    lm.saldo_final,
    lm.estado,
    u.name as cerrado_por
FROM liquidaciones_mensuales lm
JOIN zonas z ON z.id = lm.zona_id
LEFT JOIN users u ON u.id = lm.cerrado_por
WHERE lm.anio = 2026 
  AND lm.mes = 1
  AND lm.zona_id IS NOT NULL  -- Solo zonas, no estaciones
ORDER BY z.nombre;
```

**Resultado:**
```
┌────────────────┬─────┬──────┬────────────┬──────────┬─────────┬────────────────┐
│ zona           │ mes │ anio │ saldo_inic │ saldo_fin│ estado  │ cerrado_por    │
├────────────────┼─────┼──────┼────────────┼──────────┼─────────┼────────────────┤
│ Zona Occidente │  1  │ 2026 │ $30,000    │ $58,000  │ cerrado │ Gerente Occ    │
│ Zona Sur       │  1  │ 2026 │ $50,000    │ $85,904  │ cerrado │ Gerente Sur    │
└────────────────┴─────┴──────┴────────────┴──────────┴─────────┴────────────────┘
```

---

## ✅ Ventajas del Cierre por Zona

1. **Autonomía:** Cada zona opera a su propio ritmo
2. **Escalabilidad:** Se pueden agregar zonas sin afectar las existentes
3. **Responsabilidad:** Cada gerente es responsable de su zona
4. **Flexibilidad:** Una zona puede liquidar mientras otra sigue operando
5. **Auditoría:** Registros independientes por zona
6. **Rendimiento:** Consultas más rápidas al filtrar por zona

---

## 🎯 Resumen

| Aspecto | Cierre Operativo | Cierre Contable |
|---------|------------------|-----------------|
| **Alcance** | Por zona | Por zona |
| **Responsable** | Gerente de Zona | Gerente de Zona |
| **Tabla** | `zonas_periodos_cierre` | `liquidaciones_mensuales` |
| **Bloquea** | Captura de reportes | Gastos y entregas |
| **Independiente** | ✅ Sí | ✅ Sí |
| **Reversible** | ✅ Sí (reabrir) | ✅ Sí (reabrir) |

**Cada zona es completamente independiente en ambos cierres.**

---

**Última actualización:** 2 de febrero de 2026  
**Versión:** 1.0  
**Mantenido por:** Equipo de Desarrollo
