# 📅 Sistema de Gestión de Periodos Fiscales

## 🎯 Objetivo

Controlar qué años fiscales están activos en el sistema, permitiendo que solo los ejercicios habilitados aparezcan en los filtros de fecha, mientras se preservan los datos históricos de años inactivos.

---

## ✅ Componentes Implementados

### 1. **Base de Datos**

#### Tabla: `ejercicios_fiscales`
```sql
CREATE TABLE ejercicios_fiscales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anio INTEGER UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo', -- activo, inactivo, cerrado
  descripcion TEXT,
  creado_por UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Datos Iniciales:
- **2025** - Ejercicio Fiscal 2025 (activo)
- **2026** - Ejercicio Fiscal 2026 (activo)

---

### 2. **Backend - API Endpoints**

#### **Para Todos los Usuarios:**
```
GET /api/ejercicios/activos
```
→ Devuelve solo los ejercicios con estado `'activo'`  
→ Usado en todos los filtros de fecha del sistema

#### **Para Administrador:**
```
GET /api/ejercicios
GET /api/ejercicios/:anio/periodos
POST /api/ejercicios
PATCH /api/ejercicios/:id/estado
```

**Archivos:**
- `server/src/controllers/ejercicios.controller.ts`
- `server/src/routes/ejercicios.routes.ts`

---

### 3. **Frontend - Vista de Administración**

#### **Ruta:** `/gestion-periodos`
- Solo accesible para rol `Administrador`
- Item agregado al menú lateral del administrador

#### **Características:**

**Tabla Principal:**
- Lista de todos los ejercicios fiscales
- Badges de estado (activo/inactivo/cerrado)
- Barras de progreso (cierres operativos y contables)
- Botones para activar/desactivar ejercicios

**Vista Expandible por Año:**
- Click en flechas para expandir
- 12 tarjetas (una por mes)
- Estado de cada mes:
  - Cierre operativo (abierto/cerrado)
  - Cierre contable (abierto/cerrado)
  - Estadísticas (reportes, gastos, entregas)

**Modal para Crear Ejercicio:**
- Año
- Nombre
- Descripción (opcional)

**Archivos:**
- `src/pages/GestionPeriodos.tsx`
- `src/services/ejerciciosService.ts`

---

### 4. **Hook Personalizado**

#### **`useEjerciciosActivos()`**

Hook reutilizable para obtener ejercicios activos en cualquier componente:

```typescript
const { 
  ejercicios,          // Lista completa de ejercicios activos
  aniosDisponibles,    // Solo los años [2026, 2025]
  isLoading,          // Estado de carga
  isAnioActivo,       // Función para validar si un año está activo
  anioMasReciente     // Año más reciente activo
} = useEjerciciosActivos();
```

**Archivo:** `src/hooks/useEjerciciosActivos.ts`

---

### 5. **Integración en Filtros de Fecha**

Los siguientes componentes ahora usan ejercicios activos en lugar de generar años manualmente:

✅ **DashboardFinanciero.tsx**
```typescript
// ANTES:
const getYearOptions = () => {
  const currentYear = getCurrentYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }
  return years;
};

// DESPUÉS:
const { aniosDisponibles } = useEjerciciosActivos();
```

✅ **VistaDashboard.tsx** (Dashboard Gerente de Zona)
```typescript
const { aniosDisponibles } = useEjerciciosActivos();

// Selector de año:
{aniosDisponibles.map((year) => (
  <option key={year} value={year}>{year}</option>
))}
```

---

## 📊 Estados de Ejercicios Fiscales

### **activo** 🟢
- Aparece en todos los filtros de fecha
- Usuarios pueden ver y trabajar con datos del año
- Color: Verde

### **inactivo** 🟡
- NO aparece en filtros de fecha
- Datos históricos preservados en la base de datos
- Solo visible para administrador en Gestión de Periodos
- Color: Gris

### **cerrado** 🔵
- Ejercicio fiscal completamente cerrado
- Histórico y de solo lectura
- Color: Azul

---

## 🚀 Flujo de Uso

### **Crear Nuevo Ejercicio (Ejemplo: 2027)**

1. Iniciar sesión como **Administrador**
2. Ir a **Gestión de Periodos** (menú lateral o `/gestion-periodos`)
3. Click en **"Nuevo Ejercicio"**
4. Llenar formulario:
   ```
   Año: 2027
   Nombre: Ejercicio Fiscal 2027
   Descripción: Año fiscal 2027
   ```
5. Click en **"Crear Ejercicio"**
6. El año **2027** ahora aparecerá en todos los selectores de fecha

### **Desactivar Año Antiguo (Ejemplo: 2020)**

1. Ir a **Gestión de Periodos**
2. Buscar el ejercicio **2020**
3. Click en el icono de **"Desactivar"** (ojo tachado)
4. El año **2020** desaparece de los filtros
5. Los datos del **2020** se conservan en la base de datos

### **Reactivar un Año**

1. Ir a **Gestión de Periodos**
2. Buscar el ejercicio inactivo
3. Click en el icono de **"Activar"** (ojo abierto)
4. El año vuelve a aparecer en los filtros

---

## 🎨 Interfaz de Usuario

### **Vista Principal**
```
┌─────────────────────────────────────────────────────────┐
│  Gestión de Períodos Fiscales    [Nuevo Ejercicio]     │
├─────────────────────────────────────────────────────────┤
│ ℹ️  Los ejercicios fiscales controlan qué años están   │
│    disponibles en los filtros de fecha del sistema.    │
├─────────────────────────────────────────────────────────┤
│ Año │ Nombre                │ Estado  │ Progreso       │
├─────┼───────────────────────┼─────────┼────────────────┤
│ ▼   │                       │         │                │
│2026 │ Ejercicio Fiscal 2026 │ Activo  │ ████░░░░ 4/12  │
│     │                       │         │ ████░░░░ 4/12  │
├─────┼───────────────────────┼─────────┼────────────────┤
│ ▶   │                       │         │                │
│2025 │ Ejercicio Fiscal 2025 │ Activo  │ ████░░░░ 4/12  │
│     │                       │         │ ████░░░░ 4/12  │
└─────┴───────────────────────┴─────────┴────────────────┘
```

### **Vista Expandida (12 Meses)**
```
┌──────────────────────────────────────────────────────────┐
│ Enero 2026      │ Febrero 2026    │ Marzo 2026          │
│ 🔓 Op: Abierto  │ 🔓 Op: Abierto  │ 🔒 Op: Cerrado     │
│ ⏳ Cont: Abierto│ ⏳ Cont: Abierto│ ✅ Cont: Cerrado    │
│ 150 Reportes    │ 145 Reportes    │ 148 Reportes        │
│ 25 Gastos       │ 30 Gastos       │ 28 Gastos           │
│ 10 Entregas     │ 12 Entregas     │ 15 Entregas         │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Beneficios

### **Para Administradores:**
- ✅ Control centralizado de años activos
- ✅ Vista clara del progreso de cierre por mes
- ✅ Fácil activación/desactivación de ejercicios
- ✅ No se pierden datos históricos

### **Para Usuarios:**
- ✅ Solo ven años relevantes en filtros
- ✅ Interfaz más limpia y rápida
- ✅ Evita confusión con años antiguos
- ✅ Mejor rendimiento (menos opciones en selectores)

### **Para el Sistema:**
- ✅ Mejor rendimiento de queries
- ✅ Cache optimizado (30 minutos)
- ✅ Datos históricos preservados
- ✅ Escalabilidad a largo plazo

---

## 📁 Archivos Modificados/Creados

### **Backend:**
```
server/src/controllers/ejercicios.controller.ts   ✅ Nuevo
server/src/routes/ejercicios.routes.ts            ✅ Nuevo
server/src/index.ts                               ✅ Modificado
```

### **Frontend:**
```
src/hooks/useEjerciciosActivos.ts                 ✅ Nuevo
src/services/ejerciciosService.ts                 ✅ Nuevo
src/pages/GestionPeriodos.tsx                     ✅ Nuevo
src/pages/DashboardFinanciero.tsx                 ✅ Modificado
src/components/views/VistaDashboard.tsx           ✅ Modificado
src/App.tsx                                       ✅ Modificado
```

### **Base de Datos:**
```sql
-- Tabla principal
CREATE TABLE ejercicios_fiscales (...);

-- Datos iniciales
INSERT INTO ejercicios_fiscales (2025, 2026);

-- Item del menú
INSERT INTO menus (admin-periodos);
INSERT INTO menu_roles (Administrador);
```

---

## 🧪 Testing

### **Pruebas Realizadas:**

✅ Crear ejercicio fiscal 2027  
✅ Desactivar ejercicio 2020  
✅ Verificar que solo años activos aparecen en filtros  
✅ Expandir vista de meses  
✅ Verificar progreso de cierres  
✅ Reactivar ejercicio inactivo  
✅ Verificar permisos (solo Administrador)  

---

## 📝 Notas Importantes

1. **Cache:** Los ejercicios activos se cachean por 30 minutos en el frontend
2. **Permisos:** Solo el Administrador puede gestionar ejercicios
3. **Históricos:** Los datos de años inactivos se preservan siempre
4. **Default:** Si no hay ejercicios activos, se usa el año actual
5. **Ordenamiento:** Los años se muestran descendente (más reciente primero)

---

## 🔮 Mejoras Futuras

- [ ] Cierre automático de ejercicios cuando termina el año
- [ ] Notificaciones al crear nuevo ejercicio
- [ ] Exportar reporte de cierre anual
- [ ] Dashboard de resumen anual
- [ ] Auditoría de cambios en ejercicios

---

## 🎉 ¡Implementación Completa!

El sistema de gestión de periodos fiscales está **completamente operativo** y listo para usar.

**Acceso:**
- URL: `http://tu-servidor/gestion-periodos`
- Rol requerido: Administrador
- Item del menú: "Periodos Fiscales" 📅

---

**Fecha de Implementación:** 2 de Febrero, 2026  
**Versión:** 1.0
