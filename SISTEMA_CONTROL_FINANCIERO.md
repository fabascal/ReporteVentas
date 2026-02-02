# Sistema de Control Financiero - Especificación Completa

## 📊 Flujo del Sistema

### **Nivel 1: Estaciones**
```
Merma Generada (Utilidad/Ganancia)
  - Entregas a Zona
  - Gastos de Estación (≤ Límite configurado)
  = Resguardo de Estación
```

**Regla de liquidación mensual**: `Resguardo debe ser = 0` al cierre del mes
- Es decir: `Entregas + Gastos = Merma`

### **Nivel 2: Zonas**
```
Saldo Inicial del Mes (puede ser > 0)
  + Entregas recibidas de Estaciones
  - Entregas a Dirección
  - Gastos de Zona (≤ Límite configurado)
  = Resguardo Final (Saldo para siguiente mes)
```

**Regla**: El saldo puede ser > 0 y se arrastra al siguiente mes

### **Nivel 3: Dirección**
```
Entregas recibidas de las 3 Zonas = Total recaudado
```

---

## 🗄️ Tablas en Base de Datos

### **1. `configuracion_limites`** ✅ (Creada)
```sql
- entidad_tipo: 'estacion' | 'zona'
- entidad_id: UUID
- limite_gastos: NUMERIC(12,2) DEFAULT 100000.00
- activo: BOOLEAN
```

### **2. `gastos`** ✅ (Existente, actualizada)
```sql
- fecha: DATE
- tipo_gasto: 'estacion' | 'zona'
- estacion_id: UUID (si tipo = 'estacion')
- zona_id: UUID (si tipo = 'zona')
- monto: NUMERIC(12,2)
- concepto: TEXT
- categoria: VARCHAR(50)
- capturado_por: UUID
```

**Validación adicional**: 
- Verificar que la suma de gastos del mes no exceda el límite configurado

### **3. `entregas`** ✅ (Existente)
```sql
- fecha: DATE
- tipo_entrega: 'estacion_a_zona' | 'zona_a_direccion'
- estacion_id: UUID (si tipo = 'estacion_a_zona')
- zona_id: UUID
- zona_origen_id: UUID (si tipo = 'zona_a_direccion')
- monto: NUMERIC(12,2)
- concepto: TEXT
- registrado_por: UUID
```

### **4. `liquidaciones_mensuales`** ✅ (Existente)
```sql
- periodo_id: INTEGER
- zona_id: UUID
- estacion_id: UUID
- merma_total: NUMERIC(12,2)
- entregas_total: NUMERIC(12,2)
- gastos_total: NUMERIC(12,2)
- saldo_resguardo: NUMERIC(12,2)
- estado: 'pendiente' | 'liquidado' | 'con_diferencia'
- diferencia: NUMERIC(12,2)
- observaciones: TEXT
```

---

## 🔌 Endpoints del API

### **Gastos**

#### ✅ `POST /api/financiero/gastos` (Implementado)
**Permisos**: GerenteEstacion, GerenteZona, Administrador
**Body**:
```json
{
  "estacion_id": "uuid", // Si tipo_gasto = 'estacion'
  "zona_id": "uuid",     // Si tipo_gasto = 'zona'
  "fecha": "2026-01-15",
  "monto": 5000.00,
  "concepto": "Mantenimiento de bomba",
  "categoria": "Mantenimiento"
}
```
**Validaciones**:
- ✅ Monto > 0
- ✅ Usuario tiene acceso a la entidad
- ⚠️ **PENDIENTE**: Validar límite mensual

#### ✅ `GET /api/financiero/gastos` (Implementado)
**Query params**: `estacion_id`, `zona_id`, `mes`, `anio`

---

### **Entregas**

#### ⚙️ `POST /api/financiero/entregas` (A implementar)
**Permisos**: GerenteZona (entregas de estación), GerenteZona (entregas a dirección)
**Body**:
```json
{
  "tipo_entrega": "estacion_a_zona",
  "estacion_id": "uuid",
  "zona_id": "uuid",
  "fecha": "2026-01-10",
  "monto": 10000.00,
  "concepto": "Entrega parcial enero"
}
```

#### ⚙️ `GET /api/financiero/entregas` (A implementar)
**Query params**: `estacion_id`, `zona_id`, `mes`, `anio`

---

### **Límites**

#### ⚙️ `GET /api/financiero/limites/:entidad_tipo/:entidad_id` (A implementar)
**Response**:
```json
{
  "limite_gastos": 100000.00,
  "gastos_mes_actual": 25000.00,
  "disponible": 75000.00
}
```

#### ⚙️ `PUT /api/financiero/limites/:entidad_tipo/:entidad_id` (A implementar)
**Permisos**: Administrador
**Body**:
```json
{
  "limite_gastos": 150000.00
}
```

---

### **Liquidación**

#### ⚙️ `POST /api/financiero/liquidar-mes` (A implementar)
**Permisos**: GerenteZona, Administrador
**Body**:
```json
{
  "zona_id": "uuid",
  "mes": 1,
  "anio": 2026
}
```
**Proceso**:
1. Calcular merma total por estación
2. Calcular entregas totales por estación
3. Calcular gastos totales por estación
4. Verificar: `merma = entregas + gastos` (diferencia ≤ tolerancia)
5. Registrar en `liquidaciones_mensuales`
6. Calcular saldo de zona para siguiente mes

#### ⚙️ `GET /api/financiero/estado-liquidacion` (A implementar)
**Query params**: `zona_id`, `mes`, `anio`
**Response**:
```json
{
  "zona": "Zona Sur",
  "periodo": "Enero 2026",
  "estaciones": [
    {
      "nombre": "AUTLAN",
      "merma": 543904.03,
      "entregas": 500000.00,
      "gastos": 43904.03,
      "resguardo": 0,
      "estado": "liquidado"
    }
  ],
  "resumen_zona": {
    "total_entregas_recibidas": 5000000.00,
    "entregas_a_direccion": 4500000.00,
    "gastos_zona": 100000.00,
    "saldo_inicial": 20000.00,
    "saldo_final": 420000.00
  }
}
```

---

## 🎯 Casos de Uso

### **Caso 1: Gerente de Estación**
1. Ve su dashboard financiero (merma, entregas, gastos, resguardo)
2. Puede registrar gastos (validando límite)
3. Ve cuánto debe entregar al gerente de zona
4. NO puede registrar entregas (lo hace el gerente de zona)

### **Caso 2: Gerente de Zona**
1. Ve dashboard de todas sus estaciones
2. Registra entregas recibidas de cada estación
3. Registra gastos de zona (validando límite)
4. Registra entregas a dirección
5. Ejecuta proceso de liquidación mensual
6. Ve su saldo para siguiente mes

### **Caso 3: Dirección**
1. Ve dashboard consolidado de las 3 zonas
2. Ve total de entregas recibidas
3. Ve histórico de liquidaciones

---

## ✅ Estado de Implementación

- ✅ Tabla `configuracion_limites` creada
- ✅ Límites por defecto (100,000) para todas las estaciones y zonas
- ✅ Endpoint para registrar gastos de estación
- ✅ Endpoint para obtener gastos
- ✅ Dashboard financiero mostrando merma y gastos

### Pendiente (Prioridad Alta):
1. ⚙️ Validar límite de gastos al registrar
2. ⚙️ Endpoints de entregas (estación → zona, zona → dirección)
3. ⚙️ Modal para registrar entregas (Gerente de Zona)
4. ⚙️ Proceso de liquidación mensual
5. ⚙️ Dashboard mejorado con todas las métricas
6. ⚙️ Gestión de límites (CRUD)

---

## 📝 Notas Técnicas

### Validación de Límites
```sql
SELECT 
  cl.limite_gastos,
  COALESCE(SUM(g.monto), 0) as gastos_acumulados,
  cl.limite_gastos - COALESCE(SUM(g.monto), 0) as disponible
FROM configuracion_limites cl
LEFT JOIN gastos g ON g.estacion_id = cl.entidad_id 
  AND g.fecha >= :fecha_inicio_mes
  AND g.fecha <= :fecha_fin_mes
WHERE cl.entidad_id = :id AND cl.entidad_tipo = :tipo
GROUP BY cl.limite_gastos
```

### Cálculo de Resguardo
```sql
-- Por Estación:
Resguardo = Merma - Entregas - Gastos

-- Por Zona:
Resguardo = Saldo_Anterior + Entregas_Recibidas - Entregas_Direccion - Gastos_Zona
```

### Proceso de Cierre Mensual
1. Verificar que todas las estaciones estén liquidadas (resguardo = 0)
2. Calcular saldo final de zona
3. Registrar en `liquidaciones_mensuales`
4. El saldo final se convierte en saldo inicial del siguiente mes
