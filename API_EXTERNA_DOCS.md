# Documentación API Externa - Sistema de Reportes de Ventas

## Autenticación con API Key

### 1. Obtener Token de Acceso

**Endpoint**: `POST /api/external/auth`

**Request**:
```bash
curl -X POST http://189.206.183.110:3001/api/external/auth \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "demo_api_user",
    "api_secret": "demo_secret_123"
  }'
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "expires_at": "2026-02-02T05:19:41.942Z",
  "api_key": "demo_api_user",
  "nombre": "Usuario API Demo"
}
```

### 2. Validar Token

**Endpoint**: `POST /api/external/validate`

**Request**:
```bash
curl -X POST http://189.206.183.110:3001/api/external/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response** (200 OK):
```json
{
  "success": true,
  "valid": true,
  "api_key": "demo_api_user",
  "nombre": "Usuario API Demo",
  "type": "api_external",
  "expires_at": "2026-02-02T05:19:41.942Z"
}
```

### 3. Renovar Token

**Endpoint**: `POST /api/external/refresh`

**Request**:
```bash
curl -X POST http://189.206.183.110:3001/api/external/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "expires_at": "2026-02-02T05:34:41.942Z",
  "api_key": "demo_api_user",
  "nombre": "Usuario API Demo"
}
```

## Errores Comunes

### 400 Bad Request
```json
{
  "success": false,
  "error": "API key y API secret son requeridos"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "API key inválida"
}
```

```json
{
  "success": false,
  "error": "API secret inválida"
}
```

```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Error interno del servidor"
}
```

## Credenciales de Prueba

- **API Key**: `demo_api_user`
- **API Secret**: `demo_secret_123`
- **Token Duration**: 15 minutos

## Ejemplo con jQuery/AJAX

```javascript
var settings = {
  "url": "http://189.206.183.110:3001/api/external/auth",
  "method": "POST",
  "timeout": 0,
  "headers": {
    "Content-Type": "application/json"
  },
  "data": JSON.stringify({
    "api_key": "demo_api_user",
    "api_secret": "demo_secret_123"
  }),
};

$.ajax(settings).done(function (response) {
  console.log(response);
  // Guardar el token para futuras peticiones
  localStorage.setItem('api_token', response.token);
});
```

## Ejemplo con JavaScript Fetch

```javascript
fetch('http://189.206.183.110:3001/api/external/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    api_key: 'demo_api_user',
    api_secret: 'demo_secret_123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Token:', data.token);
  console.log('Expires:', data.expires_at);
})
.catch(error => console.error('Error:', error));
```

---

## 4. Obtener Reportes Mensuales Agregados

**Endpoint**: `GET /api/external/reportes-mensuales`

**Parámetros Query**:
- `identificador_externo` (string, requerido): Identificador externo de la estación (ej: 11091)
- `anio` (integer, requerido): Año del reporte (ej: 2025)
- `mes` (integer, requerido): Mes del reporte (1-12)

**Request**:
```bash
curl -X GET "http://189.206.183.110:3001/api/external/reportes-mensuales?identificador_externo=11091&anio=2025&mes=11" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "estacion": {
      "id": "4ede20dd-c902-47bd-892d-7661d0b66f17",
      "nombre": "AUTLAN",
      "identificador_externo": "11091"
    },
    "periodo": {
      "mes": 11,
      "anio": 2025
    },
    "agregados": {
      "premium": {
        "total_litros": 122648.67,
        "total_importe": 3303237.01,
        "precio_promedio": 26.93,
        "total_merma_volumen": 5982.78,
        "total_merma_importe": 161141.26,
        "merma_porcentaje_promedio": 4.8832,
        "total_eficiencia_real": 5978.67,
        "total_eficiencia_importe": 161030.32,
        "eficiencia_real_porcentaje_promedio": 4.8788
      },
      "magna": {
        "total_litros": 321076.68,
        "total_importe": 7702636.3,
        "precio_promedio": 23.99,
        "total_merma_volumen": 14394.61,
        "total_merma_importe": 345324.07,
        "merma_porcentaje_promedio": 4.4766,
        "total_eficiencia_real": 14382.68,
        "total_eficiencia_importe": 345040.48,
        "eficiencia_real_porcentaje_promedio": 4.4721
      },
      "diesel": {
        "total_litros": 59172.52,
        "total_importe": 1607905.17,
        "precio_promedio": 26.21,
        "total_merma_volumen": 1375.2,
        "total_merma_importe": 37438.7,
        "merma_porcentaje_promedio": 2.4561,
        "total_eficiencia_real": -140.48,
        "total_eficiencia_importe": 34518.63,
        "eficiencia_real_porcentaje_promedio": 1.9931
      },
      "totales": {
        "total_ventas": 12613778.48,
        "total_aceites": 73101.58,
        "dias_reportados": 30,
        "gran_total": 12686880.06
      }
    },
    "metadata": {
      "created_at": "2026-01-27T02:00:14.157Z"
    }
  }
}
```

### Ejemplo con jQuery/AJAX

```javascript
var settings = {
  "url": "http://189.206.183.110:3001/api/external/reportes-mensuales?identificador_externo=11091&anio=2025&mes=11",
  "method": "GET",
  "timeout": 0,
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN_HERE"
  },
};

$.ajax(settings).done(function (response) {
  console.log(response);
  console.log('Estación:', response.data.estacion.nombre);
  console.log('Total Ventas:', response.data.agregados.totales.total_ventas);
});
```

### Errores Específicos

**400 Bad Request**
```json
{
  "success": false,
  "error": "identificador_externo, anio y mes son requeridos"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Token de autenticación no proporcionado"
}
```

```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Token no válido para API externa"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Estación no encontrada"
}
```

```json
{
  "success": false,
  "error": "No se encontraron datos para el periodo especificado"
}
```

---

## 5. Obtener Eficiencia de Todas las Estaciones

**Endpoint**: `GET /api/external/eficiencia-estaciones`

**Parámetros Query**:
- `anio` (integer, requerido): Año del reporte (ej: 2025)
- `mes` (integer, requerido): Mes del reporte (1-12)

**Request**:
```bash
curl -X GET "http://189.206.183.110:3001/api/external/eficiencia-estaciones?anio=2025&mes=11" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "periodo": {
      "mes": 11,
      "anio": 2025
    },
    "total_estaciones": 48,
    "total_zonas": 2,
    "zonas": [
      {
        "nombre": "Zona Occidente",
        "total_estaciones": 22,
        "estaciones": [
          {
            "id": "a9e5196d-ce0b-401f-b4ec-fab3b0e169a7",
            "nombre": "8 DE JULIO",
            "identificador_externo": "2791",
            "eficiencia": {
              "premium": {
                "litros": 1234.56,
                "porcentaje": 4.5
              },
              "magna": {
                "litros": 2345.67,
                "porcentaje": 3.8
              },
              "diesel": {
                "litros": 567.89,
                "porcentaje": 2.1
              }
            },
            "dias_reportados": 30,
            "fecha_actualizacion": "2026-01-27T03:17:12.787Z"
          }
        ]
      },
      {
        "nombre": "Zona Sur",
        "total_estaciones": 26,
        "estaciones": [
          {
            "id": "4ede20dd-c902-47bd-892d-7661d0b66f17",
            "nombre": "AUTLAN",
            "identificador_externo": "11091",
            "eficiencia": {
              "premium": {
                "litros": 5978.67,
                "porcentaje": 4.8788
              },
              "magna": {
                "litros": 14382.68,
                "porcentaje": 4.4721
              },
              "diesel": {
                "litros": -140.48,
                "porcentaje": 1.9931
              }
            },
            "dias_reportados": 30,
            "fecha_actualizacion": "2026-01-27T02:00:14.157Z"
          }
        ]
      }
    ]
  }
}
```

### Ejemplo con jQuery/AJAX

```javascript
var settings = {
  "url": "http://189.206.183.110:3001/api/external/eficiencia-estaciones?anio=2025&mes=11",
  "method": "GET",
  "timeout": 0,
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN_HERE"
  },
};

$.ajax(settings).done(function (response) {
  console.log(response);
  console.log('Total estaciones:', response.data.total_estaciones);
  console.log('Total zonas:', response.data.total_zonas);
  
  // Iterar por zonas
  response.data.zonas.forEach(zona => {
    console.log(`Zona: ${zona.nombre} (${zona.total_estaciones} estaciones)`);
    
    // Iterar por estaciones de la zona
    zona.estaciones.forEach(est => {
      console.log(`  ${est.nombre}: Premium ${est.eficiencia.premium.litros}L (${est.eficiencia.premium.porcentaje}%)`);
    });
  });
});
```

### Errores Específicos

**400 Bad Request**
```json
{
  "success": false,
  "error": "anio y mes son requeridos"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Token de autenticación no proporcionado"
}
```

```json
{
  "success": false,
  "error": "Token inválido o expirado"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Token no válido para API externa"
}
```

## Notas de Seguridad

1. **Mantén tu API Secret seguro**: Nunca expongas tu API Secret en código del lado del cliente
2. **Usa HTTPS en producción**: Asegúrate de usar HTTPS para todas las peticiones
3. **Renueva tokens antes de expirar**: Los tokens expiran en 15 minutos
4. **Almacena tokens de forma segura**: Usa `httpOnly` cookies o almacenamiento seguro

## Tabla de Base de Datos

Los usuarios API se almacenan en la tabla `api_users`:

```sql
CREATE TABLE api_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  estaciones_permitidas UUID[],
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Para crear un nuevo usuario API:

```sql
INSERT INTO api_users (api_key, api_secret, nombre, estaciones_permitidas, activo)
VALUES ('tu_api_key', 'tu_api_secret', 'Nombre Usuario', ARRAY[]::UUID[], true);
```
