# ✅ Checklist de Verificación del Sistema

## 📋 Lista de Verificación Post-Implementación

### 1. **Cierre Contable por Zona** 💼

- [ ] **Login como Gerente de Zona**
  ```
  URL: http://189.206.183.110:3030/
  Usuario: Gerente de Zona Sur
  Password: [tu password]
  ```

- [ ] **Verificar Dashboard Financiero**
  - [ ] Navegar a "Control Financiero - Resguardos"
  - [ ] Verificar diseño sobrio (fondo blanco, bordes sutiles)
  - [ ] Ver KPIs: Saldo Inicial, Entregas, Gastos, Resguardo, Pendiente
  - [ ] Verificar estadísticas: Liquidadas, En Proceso, Por Liquidar, %

- [ ] **Verificar Estados de Estaciones**
  - [ ] Estaciones con Merma $0 → "Sin Actividad" (Gris)
  - [ ] Estaciones con Merma > 0, Entregas = 0 → "En Proceso" (Azul)
  - [ ] Estaciones con Entregas parciales → "Parcial" o "Por Liquidar"
  - [ ] Estaciones con Saldo = 0 → "Liquidado" (Verde)

- [ ] **Probar Botón "Liquidar Período"**
  - [ ] Hacer clic en "Liquidar Período" (botón púrpura)
  - [ ] Verificar modal de liquidación
  - [ ] Ver resumen financiero
  - [ ] Ver estado de validación (verde o rojo)
  - [ ] Si hay pendientes, ver lista de estaciones
  - [ ] Agregar observaciones (opcional)
  - [ ] Confirmar liquidación (doble confirmación)

- [ ] **Verificar Liquidación en Base de Datos**
  ```sql
  PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c "
  SELECT 
    z.nombre, lm.mes, lm.anio, lm.saldo_final, lm.estado 
  FROM liquidaciones_mensuales lm 
  JOIN zonas z ON z.id = lm.zona_id 
  WHERE lm.zona_id IS NOT NULL 
  ORDER BY lm.fecha_cierre DESC LIMIT 5;"
  ```

- [ ] **Probar Bloqueo de Modificaciones**
  - [ ] Intentar registrar gasto para período cerrado
  - [ ] Debe mostrar error: "El período contable está liquidado"
  - [ ] Intentar registrar entrega para período cerrado
  - [ ] Debe mostrar error: "El período contable está liquidado"

---

### 2. **Modal de Entregas Dinámico** 🔄

- [ ] **Abrir Modal de Entregas**
  - [ ] Click en "Registrar Entrega"
  - [ ] Seleccionar estación: AUTLAN
  - [ ] Ver resguardo inicial (del mes actual)

- [ ] **Cambiar Fecha y Verificar Recálculo**
  - [ ] Cambiar fecha a noviembre 2025
  - [ ] Ver spinner "Calculando resguardo..."
  - [ ] Verificar badge: "nov 2025"
  - [ ] Ver resguardo actualizado de noviembre
  - [ ] Cambiar a enero 2026
  - [ ] Ver badge: "ene 2026"
  - [ ] Ver resguardo actualizado de enero

- [ ] **Registrar Entrega**
  - [ ] Ingresar monto (menor al resguardo)
  - [ ] Agregar concepto
  - [ ] Confirmar entrega
  - [ ] Verificar actualización del dashboard

---

### 3. **Particionamiento de Tablas** 📊

- [ ] **Verificar Particiones Existentes**
  ```bash
  PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c "
  SELECT tablename FROM pg_tables 
  WHERE schemaname = 'public' 
    AND (tablename LIKE 'gastos_%' 
      OR tablename LIKE 'entregas_%')
  ORDER BY tablename;"
  ```
  - [ ] Debe mostrar: 2024, 2025, 2026, 2027, 2028, 2029, 2030

- [ ] **Probar Script Automático**
  ```bash
  PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas \
    -f /home/webops/ReporteVentas/server/migrations/crear_particiones_futuras.sql
  ```
  - [ ] Ver mensaje: "PARTICIONES CREADAS EXITOSAMENTE"
  - [ ] Verificar partición 2027 creada (o siguiente año)

- [ ] **Verificar Tamaños**
  ```bash
  PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c "
  SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.' || tablename))
  FROM pg_tables 
  WHERE tablename IN ('gastos_2026', 'entregas_2026');"
  ```

---

### 4. **Script de Mantenimiento** 🛠️

- [ ] **Verificar Script Ejecutable**
  ```bash
  ls -lh /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
  ```
  - [ ] Debe mostrar: `-rwxrwxr-x` (ejecutable)

- [ ] **Probar Ejecución Manual**
  ```bash
  PGPASSWORD="qwerty" /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
  ```
  - [ ] Ver mensajes: "✓ Partición ... creada"
  - [ ] Ver: "MANTENIMIENTO COMPLETADO EXITOSAMENTE"
  - [ ] Verificar log creado en `/home/webops/ReporteVentas/logs/particiones_*.log`

- [ ] **Configurar Cron Job (Opcional)**
  ```bash
  crontab -l
  ```
  - [ ] Si no existe, agregar:
  ```
  0 0 1 12 * PGPASSWORD=qwerty /home/webops/ReporteVentas/server/scripts/mantenimiento_anual_particiones.sh
  ```

---

### 5. **Frontend y Backend** 🖥️

- [ ] **Verificar Servicios PM2**
  ```bash
  pm2 status
  ```
  - [ ] `repvtas-backend` debe estar "online"
  - [ ] `repvtas-frontend` debe estar "online"

- [ ] **Verificar Logs sin Errores**
  ```bash
  tail -50 /home/webops/ReporteVentas/logs/backend-error.log
  ```
  - [ ] No debe haber errores recientes

  ```bash
  tail -50 /home/webops/ReporteVentas/logs/frontend-error.log
  ```
  - [ ] No debe haber errores recientes

- [ ] **Verificar Compilación**
  - [ ] Backend compilado: `/home/webops/ReporteVentas/server/dist/` existe
  - [ ] Frontend compilado: `/home/webops/ReporteVentas/dist/` existe

---

### 6. **Pruebas de Integración** 🧪

#### **Escenario 1: Cierre Completo de Zona**
- [ ] Login como Gerente Zona Sur
- [ ] Verificar que todas las estaciones tengan saldo = $0
- [ ] Cerrar operativamente (si no está cerrado)
- [ ] Liquidar contablemente
- [ ] Verificar que aparece en `liquidaciones_mensuales`
- [ ] Intentar registrar gasto → Debe fallar
- [ ] Intentar registrar entrega → Debe fallar

#### **Escenario 2: Zona Independiente**
- [ ] Login como Gerente Zona Occidente
- [ ] Verificar que puede operar normalmente
- [ ] Registrar entrega en Zona Occidente → Debe funcionar
- [ ] Registrar gasto en Zona Occidente → Debe funcionar
- [ ] Liquidar cuando esté listo

#### **Escenario 3: Reapertura**
- [ ] Login como Gerente Zona Sur
- [ ] Intentar reabrir período (si implementado)
- [ ] Verificar que permite modificaciones nuevamente
- [ ] Volver a cerrar

---

### 7. **Documentación** 📚

- [ ] **Verificar Archivos Creados**
  ```bash
  ls -lh /home/webops/ReporteVentas/*.md
  ```
  - [ ] `PARTICIONAMIENTO.md` existe
  - [ ] `CIERRE_CONTABLE_POR_ZONA.md` existe
  - [ ] `INSTRUCCIONES_CRON.md` existe
  - [ ] `RESUMEN_IMPLEMENTACION.md` existe
  - [ ] `CHECKLIST_VERIFICACION.md` existe (este archivo)

- [ ] **Leer Documentación**
  - [ ] Revisar flujo del cierre contable
  - [ ] Entender particionamiento
  - [ ] Conocer tareas de mantenimiento

---

### 8. **Seguridad y Permisos** 🔐

- [ ] **Verificar Roles**
  ```sql
  PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c "
  SELECT name, email, role FROM users WHERE role IN ('GerenteZona', 'GerenteEstacion');"
  ```

- [ ] **Probar Permisos**
  - [ ] Gerente Estación NO puede liquidar período
  - [ ] Gerente Zona SÍ puede liquidar su zona
  - [ ] Gerente Zona NO puede ver otra zona

- [ ] **Verificar Auditoría**
  ```sql
  PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c "
  SELECT 
    lm.mes, lm.anio, 
    u.name as cerrado_por, 
    lm.fecha_cierre 
  FROM liquidaciones_mensuales lm 
  JOIN users u ON u.id = lm.cerrado_por 
  WHERE lm.zona_id IS NOT NULL 
  ORDER BY lm.fecha_cierre DESC LIMIT 5;"
  ```

---

### 9. **Rendimiento** ⚡

- [ ] **Medir Tiempo de Consulta (Con Particiones)**
  ```sql
  \timing
  SELECT COUNT(*) FROM gastos WHERE fecha >= '2026-01-01' AND fecha < '2026-02-01';
  ```
  - [ ] Debe ser < 0.5 segundos

- [ ] **Verificar Uso de Índices**
  ```sql
  EXPLAIN ANALYZE 
  SELECT * FROM gastos 
  WHERE fecha >= '2026-01-01' AND estacion_id = '...';
  ```
  - [ ] Debe usar índice en partición específica

---

### 10. **Monitoreo** 📈

- [ ] **Dashboard del Sistema**
  - [ ] CPU < 80%
  - [ ] Memoria < 80%
  - [ ] Disco < 80%

- [ ] **PostgreSQL**
  ```bash
  sudo systemctl status postgresql
  ```
  - [ ] Debe estar "active (running)"

- [ ] **Nginx**
  ```bash
  sudo systemctl status nginx
  ```
  - [ ] Debe estar "active (running)"

---

## 🎯 Checklist Rápido (5 minutos)

Para verificación diaria:

```bash
# 1. Servicios corriendo
pm2 status

# 2. Sin errores recientes
tail -20 /home/webops/ReporteVentas/logs/backend-error.log

# 3. Base de datos conectada
PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c "SELECT 1;"

# 4. Particiones existentes
PGPASSWORD="qwerty" psql -h localhost -U webops -d repvtas -c \
  "SELECT COUNT(*) FROM pg_tables WHERE tablename LIKE 'gastos_%';"

# 5. Frontend accesible
curl -I http://189.206.183.110:3030/
```

---

## ✅ Resultado Esperado

Al completar este checklist:

- ✅ Cierre contable funcionando por zona
- ✅ Particiones creadas y optimizadas
- ✅ Dashboard financiero operativo
- ✅ Modal de entregas con recálculo dinámico
- ✅ Validaciones de períodos cerrados
- ✅ Estados de estaciones correctos
- ✅ Scripts de mantenimiento configurados
- ✅ Documentación completa y accesible

---

## 📞 Siguiente Paso

Si todos los checks están ✅, el sistema está **listo para producción**.

Si algún check falla ❌, revisar:
1. Logs de error
2. Documentación específica del módulo
3. Contactar soporte técnico

---

**Fecha de verificación:** _________________  
**Verificado por:** _________________  
**Resultado:** ⬜ Aprobado  ⬜ Con observaciones

---

**Última actualización:** 2 de febrero de 2026  
**Versión:** 1.0
