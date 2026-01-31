# 📋 API Delivery-Pickup - Documentación Completa

Documentación detallada de todos los endpoints GET del sistema Delivery-Pickup, organizados por submódulo.

**Base URL:** `/api/dp/v1`

---

## 📦 Índice de Módulos

1. [Órdenes (Orders)](#-módulo-órdenes-orders)
2. [Zonas (Zones)](#-módulo-zonas-zones)
3. [Umbrales (Thresholds)](#-módulo-umbrales-thresholds)
4. [Logs de Auditoría](#-módulo-logs-de-auditoría)
5. [Dashboard](#-módulo-dashboard)
6. [Catálogo (Catalog)](#-módulo-catálogo-catalog)
7. [Alertas (Alerts)](#-módulo-alertas-alerts)
8. [Reportes (Reports)](#-módulo-reportes-reports)

---

## 📦 Módulo: Órdenes (Orders)

Gestión completa del ciclo de vida de órdenes de delivery y pickup.

### 🔍 GET /api/dp/v1/orders

**Propósito:** Listado general de órdenes con filtros opcionales por estado y fecha.

**Características:**
- ✅ Filtrado por estado de orden
- ✅ Filtrado por fecha específica o "today"
- ✅ Sin filtros devuelve todas las órdenes

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **status** | |
| Tipo | `string` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Valores permitidos | `PENDING_REVIEW`, `IN_KITCHEN`, `READY_FOR_DISPATCH`, `EN_ROUTE`, `DELIVERED`, `CANCELLED` |
| Valor por defecto | `null` (sin filtro) |

**Descripción:** Filtra las órdenes por su estado actual.

| Propiedad | Valor |
|-----------|-------|
| **date** | |
| Tipo | `string` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Valores permitidos | `today` o formato `YYYY-MM-DD` |
| Valor por defecto | `null` (sin filtro) |

**Descripción:** Filtra las órdenes por fecha de creación.

#### Ejemplos:

```http
# Todas las órdenes
GET /api/dp/v1/orders

# Órdenes entregadas
GET /api/dp/v1/orders?status=DELIVERED

# Órdenes de hoy
GET /api/dp/v1/orders?date=today

# Órdenes entregadas de una fecha específica
GET /api/dp/v1/orders?status=DELIVERED&date=2026-01-30
```

#### 📤 Formato de Respuesta

```json
[
  {
    "order_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "readable_id": "DL-4409",
    "current_status": "IN_KITCHEN",
    "service_type": "DELIVERY",
    "customer_name": "Juan Pérez",
    "customer_phone": "+584241234567",
    "customer_email": "juan@example.com",
    "delivery_address": "Calle Principal #123",
    "zone_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "monto_total": 25.50,
    "monto_costo_envio": 3.00,
    "payment_type": "DIGITAL",
    "payment_received": true,
    "payment_reference": "REF12345",
    "items": [...],
    "created_at": "2026-01-30T14:30:00.000Z",
    "updated_at": "2026-01-30T14:35:00.000Z"
  }
]
```

---

### 🔍 GET /api/dp/v1/orders/active

**Propósito:** Listado de órdenes activas (excluye automáticamente órdenes CANCELLED y DELIVERED).

**Características:**
- ✅ Filtrado automático por estados activos
- ✅ Útil para dashboards operacionales
- ✅ Soporta filtro por fecha

#### 📊 Parámetros (Query String)

| Propiedad | Valor |
|-----------|-------|
| **date** | |
| Tipo | `string` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Valores permitidos | `today` o formato `YYYY-MM-DD` |
| Valor por defecto | `null` (sin filtro) |

#### Ejemplos:

```http
# Todas las órdenes activas
GET /api/dp/v1/orders/active

# Órdenes activas de hoy
GET /api/dp/v1/orders/active?date=today

# Órdenes activas de una fecha específica
GET /api/dp/v1/orders/active?date=2026-01-30
```

#### 📤 Formato de Respuesta

Mismo formato que `/orders`, pero solo incluye órdenes con estados:
- `PENDING_REVIEW`
- `IN_KITCHEN`
- `READY_FOR_DISPATCH`
- `EN_ROUTE`

---

### 🔍 GET /api/dp/v1/orders/status/:status

**Propósito:** Listado de órdenes filtradas por estado específico (vía path parameter).

**Características:**
- ✅ Estado especificado en la URL
- ✅ Soporta filtro adicional por fecha
- ✅ Alternativa semántica a usar query params

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **status** | |
| Tipo | `string` |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |
| Valores permitidos | `PENDING_REVIEW`, `IN_KITCHEN`, `READY_FOR_DISPATCH`, `EN_ROUTE`, `DELIVERED`, `CANCELLED` |

**Query Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **date** | |
| Tipo | `string` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Valores permitidos | `today` o formato `YYYY-MM-DD` |

#### Ejemplos:

```http
# Órdenes en cocina
GET /api/dp/v1/orders/status/IN_KITCHEN

# Órdenes entregadas hoy
GET /api/dp/v1/orders/status/DELIVERED?date=today

# Órdenes canceladas de fecha específica
GET /api/dp/v1/orders/status/CANCELLED?date=2026-01-30
```

---

### 🔍 GET /api/dp/v1/orders/:id

**Propósito:** Obtener el detalle completo de una orden específica.

**Características:**
- ✅ Acepta UUID (order_id) o ID legible (DL-####)
- ✅ Incluye todos los detalles de la orden
- ✅ Incluye items con ingredientes excluidos
- ✅ Retorna 404 si no existe

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **id** | |
| Tipo | `string` |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |
| Formatos aceptados | UUID v4 o formato `DL-####` (ej: `DL-4409`) |

#### Ejemplos:

```http
# Por UUID
GET /api/dp/v1/orders/3fa85f64-5717-4562-b3fc-2c963f66afa6

# Por ID legible
GET /api/dp/v1/orders/DL-4409
```

#### 📤 Formato de Respuesta

```json
{
  "order_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "readable_id": "DL-4409",
  "current_status": "IN_KITCHEN",
  "service_type": "DELIVERY",
  "customer_name": "Juan Pérez",
  "customer_phone": "+584241234567",
  "customer_email": "juan@example.com",
  "delivery_address": "Calle Principal #123",
  "zone_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "monto_total": 25.50,
  "monto_costo_envio": 3.00,
  "payment_type": "DIGITAL",
  "payment_received": true,
  "payment_reference": "REF12345",
  "reason_cancelled": null,
  "items": [
    {
      "order_item_id": "abc123",
      "product_id": "prod-001",
      "product_name": "Hamburguesa Especial",
      "quantity": 2,
      "unit_price": 11.25,
      "notes": "Sin cebolla",
      "excluded_recipe_ids": ["recipe-001", "recipe-002"],
      "excluded_recipe_names": ["Cebolla", "Pepinillos"]
    }
  ],
  "zone": {
    "zone_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "zone_name": "Centro",
    "is_active": true,
    "delivery_cost": 3.00
  },
  "created_at": "2026-01-30T14:30:00.000Z",
  "updated_at": "2026-01-30T14:35:00.000Z"
}
```

#### Códigos de Estado

- **200 OK** - Orden encontrada
- **404 Not Found** - Orden no existe
- **400 Bad Request** - ID inválido

---

## 🗺️ Módulo: Zonas (Zones)

Gestión de zonas de entrega y sus configuraciones.

### 🔍 GET /api/dp/v1/zones

**Propósito:** Listar todas las zonas de entrega (activas e inactivas).

**Características:**
- ✅ Retorna todas las zonas sin filtros
- ✅ Incluye información de costos de envío
- ✅ Muestra estado de activación

#### Ejemplos:

```http
GET /api/dp/v1/zones
```

#### 📤 Formato de Respuesta

```json
[
  {
    "zone_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "zone_name": "Centro",
    "description": "Zona del centro de la ciudad",
    "delivery_cost": 3.00,
    "is_active": true,
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  },
  {
    "zone_id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "zone_name": "Norte",
    "description": "Zona norte",
    "delivery_cost": 5.00,
    "is_active": false,
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-20T15:30:00.000Z"
  }
]
```

---

### 🔍 GET /api/dp/v1/zones/active

**Propósito:** Listar únicamente las zonas activas.

**Características:**
- ✅ Filtrado automático por `is_active = true`
- ✅ Útil para selección de zonas en formularios
- ✅ Optimizado para frontend

#### Ejemplos:

```http
GET /api/dp/v1/zones/active
```

#### 📤 Formato de Respuesta

Mismo formato que `/zones`, pero solo incluye zonas con `is_active: true`.

---

### 🔍 GET /api/dp/v1/zones/:zone_id

**Propósito:** Obtener el detalle de una zona específica.

**Características:**
- ✅ Retorna información completa de la zona
- ✅ Retorna 404 si no existe

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **zone_id** | |
| Tipo | `string` (UUID v4) |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |

#### Ejemplos:

```http
GET /api/dp/v1/zones/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

#### 📤 Formato de Respuesta

```json
{
  "zone_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "zone_name": "Centro",
  "description": "Zona del centro de la ciudad",
  "delivery_cost": 3.00,
  "is_active": true,
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

#### Códigos de Estado

- **200 OK** - Zona encontrada
- **404 Not Found** - Zona no existe
- **400 Bad Request** - zone_id inválido

---

## ⚙️ Módulo: Umbrales (Thresholds)

Configuración de umbrales y límites operacionales del sistema.

### 🔍 GET /api/dp/v1/thresholds

**Propósito:** Listar todos los umbrales configurados (activos e inactivos).

**Características:**
- ✅ Retorna todas las configuraciones de umbrales
- ✅ Incluye métricas afectadas
- ✅ Muestra valores de umbral y tiempo

#### Ejemplos:

```http
GET /api/dp/v1/thresholds
```

#### 📤 Formato de Respuesta

```json
[
  {
    "threshold_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "metric_affected": "pending_review_time",
    "threshold_value": 10,
    "time_unit": "minutes",
    "is_active": true,
    "description": "Tiempo máximo en PENDING_REVIEW antes de alerta",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  },
  {
    "threshold_id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "metric_affected": "in_kitchen_time",
    "threshold_value": 30,
    "time_unit": "minutes",
    "is_active": true,
    "description": "Tiempo máximo en cocina",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  }
]
```

---

### 🔍 GET /api/dp/v1/thresholds/active

**Propósito:** Listar únicamente los umbrales activos.

**Características:**
- ✅ Filtrado automático por `is_active = true`
- ✅ Útil para cálculos de alertas en tiempo real
- ✅ Optimizado para monitoreo

#### Ejemplos:

```http
GET /api/dp/v1/thresholds/active
```

#### 📤 Formato de Respuesta

Mismo formato que `/thresholds`, pero solo incluye umbrales con `is_active: true`.

---

### 🔍 GET /api/dp/v1/thresholds/by-metric/:metric_affected

**Propósito:** Obtener el umbral configurado para una métrica específica.

**Características:**
- ✅ Búsqueda por tipo de métrica
- ✅ Retorna configuración única por métrica
- ✅ Retorna 404 si no existe

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **metric_affected** | |
| Tipo | `string` |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |
| Valores permitidos | Depende de `VALID_METRICS` en el sistema (ej: `pending_review_time`, `in_kitchen_time`, `ready_for_dispatch_time`, `en_route_time`) |

#### Ejemplos:

```http
# Umbral de tiempo en cocina
GET /api/dp/v1/thresholds/by-metric/in_kitchen_time

# Umbral de tiempo en revisión
GET /api/dp/v1/thresholds/by-metric/pending_review_time
```

#### 📤 Formato de Respuesta

```json
{
  "threshold_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "metric_affected": "in_kitchen_time",
  "threshold_value": 30,
  "time_unit": "minutes",
  "is_active": true,
  "description": "Tiempo máximo en cocina",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

#### Códigos de Estado

- **200 OK** - Umbral encontrado
- **404 Not Found** - No existe umbral para esa métrica
- **400 Bad Request** - metric_affected inválido

---

### 🔍 GET /api/dp/v1/thresholds/:threshold_id

**Propósito:** Obtener el detalle de un umbral específico por su ID.

**Características:**
- ✅ Retorna información completa del umbral
- ✅ Retorna 404 si no existe

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **threshold_id** | |
| Tipo | `string` (UUID v4) |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |

#### Ejemplos:

```http
GET /api/dp/v1/thresholds/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

#### 📤 Formato de Respuesta

```json
{
  "threshold_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "metric_affected": "in_kitchen_time",
  "threshold_value": 30,
  "time_unit": "minutes",
  "is_active": true,
  "description": "Tiempo máximo en cocina",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

#### Códigos de Estado

- **200 OK** - Umbral encontrado
- **404 Not Found** - Umbral no existe
- **400 Bad Request** - threshold_id inválido

---

## 📝 Módulo: Logs de Auditoría

Sistema completo de auditoría y trazabilidad de acciones. Para documentación detallada completa, ver la sección dedicada al final.

### 🔍 GET /api/dp/v1/logs

**Propósito:** Endpoint unificado para obtener logs del sistema. Soporta filtrado avanzado por tipo de recurso, estado y rango de fechas.

**Características:**
- ✅ Sin filtros devuelve todos los logs (Live Feed)
- ✅ Soporta múltiples filtros combinados
- ✅ Paginación incluida
- ✅ Escalable - fácil agregar nuevos filtros

#### 📊 Parámetros (Query String)

| Parámetro | Tipo | Requerido | Valores | Default | Descripción |
|-----------|------|-----------|---------|---------|-------------|
| **resource** | `string` | ❌ | `orders`, `zones`, `thresholds` | `null` | Filtra por tipo de recurso |
| **status** | `string` | ❌ | `PENDING_REVIEW`, `IN_KITCHEN`, `READY_FOR_DISPATCH`, `EN_ROUTE`, `DELIVERED`, `CANCELLED`, `ACTION` | `null` | Filtra por estado destino |
| **from** | `string` (ISO 8601) | ❌ | Formato: `YYYY-MM-DDTHH:mm:ss.sssZ` | `null` | Fecha inicio del rango |
| **to** | `string` (ISO 8601) | ❌ | Formato: `YYYY-MM-DDTHH:mm:ss.sssZ` | `null` | Fecha fin del rango |
| **limit** | `integer` | ❌ | 1 - 500 | `50` | Número máximo de resultados |
| **offset** | `integer` | ❌ | ≥ 0 | `0` | Desplazamiento para paginación |

#### Ejemplos:

```http
# Todos los logs (live feed)
GET /api/dp/v1/logs

# Solo logs de órdenes
GET /api/dp/v1/logs?resource=orders

# Órdenes entregadas hoy
GET /api/dp/v1/logs?resource=orders&status=DELIVERED&from=2026-01-30T00:00:00.000Z

# Logs de zonas con paginación
GET /api/dp/v1/logs?resource=zones&limit=25&offset=0

# Rango de fechas específico
GET /api/dp/v1/logs?from=2026-01-29T00:00:00.000Z&to=2026-01-30T23:59:59.999Z
```

Ver la sección **"Logs de Auditoría - Documentación Completa"** al final para detalles exhaustivos.

---

### 🔍 GET /api/dp/v1/logs/search

**Propósito:** Alias explícito del endpoint principal `/logs` para búsquedas.

**Características:**
- ✅ Funcionalmente equivalente a `/logs`
- ✅ Mismos parámetros y respuesta
- ✅ Útil para claridad semántica en el código

#### Ejemplos:

```http
# Búsqueda de órdenes canceladas
GET /api/dp/v1/logs/search?resource=orders&status=CANCELLED
```

---

### 🔍 GET /api/dp/v1/logs/:log_id

**Propósito:** Obtener el detalle completo de un log específico.

**Características:**
- ✅ Retorna log individual por ID
- ✅ Incluye toda la información de auditoría
- ✅ Retorna 404 si no existe

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **log_id** | |
| Tipo | `string` (UUID v4) |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |

#### Ejemplos:

```http
GET /api/dp/v1/logs/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

#### 📤 Formato de Respuesta

```json
{
  "log_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "order_id": "9f010790-c528-4327-ba5e-c9edc4e6711c",
  "timestamp_transition": "2026-01-30T18:21:03.673Z",
  "status_from": "PENDING_REVIEW",
  "status_to": "IN_KITCHEN",
  "cancellation_reason": null,
  "http_method": "PATCH",
  "path": "/api/dp/v1/orders/abc123/status",
  "resource": "orders",
  "logs_type": "orders",
  "manager": "Jhon - admin@charlotte.com",
  "manager_display": "Jhon - admin@charlotte.com",
  "order": {
    "order_id": "9f010790-c528-4327-ba5e-c9edc4e6711c",
    "readable_id": "DL-4409",
    "current_status": "IN_KITCHEN"
  }
}
```

---

### 🔍 GET /api/dp/v1/logs/by-order/:order_id

**Propósito:** Ver la historia completa de transiciones de una orden específica.

**Características:**
- ✅ Timeline cronológico de una orden
- ✅ Ordenamiento ascendente (del más antiguo al más reciente)
- ✅ Útil para auditoría de órdenes individuales
- ✅ Soporta paginación

#### 📊 Parámetros

**Path Parameter:**

| Propiedad | Valor |
|-----------|-------|
| **order_id** | |
| Tipo | `string` (UUID v4) |
| Ubicación | Path parameter |
| Requerido | ✅ Sí |

**Query Parameters:**

| Parámetro | Tipo | Requerido | Rango | Default |
|-----------|------|-----------|-------|---------|
| **limit** | `integer` | ❌ | 1 - 500 | `200` |
| **offset** | `integer` | ❌ | ≥ 0 | `0` |

#### Ejemplos:

```http
# Historia completa de una orden
GET /api/dp/v1/logs/by-order/9f010790-c528-4327-ba5e-c9edc4e6711c

# Con paginación
GET /api/dp/v1/logs/by-order/9f010790-c528-4327-ba5e-c9edc4e6711c?limit=10&offset=0
```

#### 📤 Formato de Respuesta

Array de logs ordenados cronológicamente (ASC), mismo formato que endpoint `/logs/:log_id`.

#### Uso Típico

Timeline de una orden específica en el dashboard de administración.

---

## 📊 Módulo: Dashboard

Endpoints específicos para vistas agregadas del dashboard administrativo.

### 🔍 GET /api/dp/v1/dashboard/orders

**Propósito:** Obtener órdenes agrupadas por estado actual para visualización en dashboard.

**Características:**
- ✅ Agrupa órdenes por su `current_status`
- ✅ Retorna conteo por estado
- ✅ Útil para widgets de resumen
- ✅ Optimizado para dashboards en tiempo real

#### Ejemplos:

```http
GET /api/dp/v1/dashboard/orders
```

#### 📤 Formato de Respuesta

```json
{
  "PENDING_REVIEW": {
    "count": 5,
    "orders": [...]
  },
  "IN_KITCHEN": {
    "count": 12,
    "orders": [...]
  },
  "READY_FOR_DISPATCH": {
    "count": 3,
    "orders": [...]
  },
  "EN_ROUTE": {
    "count": 8,
    "orders": [...]
  },
  "DELIVERED": {
    "count": 45,
    "orders": [...]
  },
  "CANCELLED": {
    "count": 2,
    "orders": [...]
  }
}
```

#### Uso Típico

- Dashboard principal del administrador
- Widgets de conteo por estado
- Visualización de carga operacional

---

## 📖 Módulo: Catálogo (Catalog)

Integración con el sistema Kitchen para obtener el catálogo de productos.

### 🔍 GET /api/dp/v1/catalog

**Propósito:** Obtener el catálogo completo de productos desde el sistema Kitchen.

**Características:**
- ✅ Proxy al API de Kitchen
- ✅ Retorna productos, categorías y recetas
- ✅ Incluye información de ingredientes
- ✅ Cache automático (dependiendo de configuración)

#### Ejemplos:

```http
GET /api/dp/v1/catalog
```

#### 📤 Formato de Respuesta

```json
{
  "source": "kitchen-api",
  "categories": [
    {
      "category_id": "cat-001",
      "name": "Hamburguesas",
      "products": [...]
    }
  ],
  "products": [
    {
      "product_id": "prod-001",
      "name": "Hamburguesa Especial",
      "description": "Hamburguesa con queso y tocino",
      "price": 11.25,
      "category_id": "cat-001",
      "is_available": true,
      "recipes": [
        {
          "recipe_id": "recipe-001",
          "name": "Cebolla",
          "type": "ingredient"
        }
      ]
    }
  ]
}
```

#### Notas Importantes

- El formato exacto depende del API de Kitchen
- El campo `source` siempre indica `"kitchen-api"`
- Este endpoint puede tener latencia dependiendo del sistema externo

---

## 🚨 Módulo: Alertas (Alerts)

Sistema de alertas basado en umbrales de tiempo.

### 🔍 GET /api/dp/v1/alerts

**Propósito:** Listar alertas actuales basadas en thresholds de tiempo configurados.

**Características:**
- ✅ Calcula alertas en tiempo real
- ✅ Basado en umbrales activos
- ✅ Identifica órdenes que exceden tiempos
- ✅ Incluye severidad de alerta

#### Ejemplos:

```http
GET /api/dp/v1/alerts
```

#### 📤 Formato de Respuesta

```json
[
  {
    "alert_id": "alert-001",
    "order_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "readable_id": "DL-4409",
    "current_status": "IN_KITCHEN",
    "metric_affected": "in_kitchen_time",
    "threshold_value": 30,
    "time_unit": "minutes",
    "current_time_in_status": 45,
    "exceeded_by": 15,
    "severity": "high",
    "created_at": "2026-01-30T14:30:00.000Z"
  },
  {
    "alert_id": "alert-002",
    "order_id": "4fa85f64-5717-4562-b3fc-2c963f66afa7",
    "readable_id": "DL-4410",
    "current_status": "READY_FOR_DISPATCH",
    "metric_affected": "ready_for_dispatch_time",
    "threshold_value": 10,
    "time_unit": "minutes",
    "current_time_in_status": 12,
    "exceeded_by": 2,
    "severity": "medium",
    "created_at": "2026-01-30T15:00:00.000Z"
  }
]
```

#### Campos de Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `alert_id` | `string` | Identificador único de la alerta |
| `order_id` | `UUID` | ID de la orden afectada |
| `readable_id` | `string` | ID legible de la orden (DL-####) |
| `current_status` | `string` | Estado actual de la orden |
| `metric_affected` | `string` | Métrica que genera la alerta |
| `threshold_value` | `number` | Valor del umbral configurado |
| `time_unit` | `string` | Unidad de tiempo (minutes, hours) |
| `current_time_in_status` | `number` | Tiempo actual en el estado |
| `exceeded_by` | `number` | Cuánto se excedió el umbral |
| `severity` | `string` | Severidad: low, medium, high, critical |

#### Uso Típico

- Dashboard de alertas operacionales
- Notificaciones push/email
- Monitoreo de SLA
- Identificación de cuellos de botella

---

## 📄 Módulo: Reportes (Reports)

Generación de reportes y exportación de datos.

### 🔍 GET /api/dp/v1/reports/export

**Propósito:** Exportar reporte completo de órdenes en formato CSV.

**Características:**
- ✅ Genera archivo CSV descargable
- ✅ Incluye todas las órdenes
- ✅ Headers HTTP configurados para descarga
- ✅ Nombre de archivo con timestamp

#### Ejemplos:

```http
GET /api/dp/v1/reports/export
```

#### 📤 Formato de Respuesta

**Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="orders-report-2026-01-30.csv"
```

**Body (CSV):**
```csv
order_id,readable_id,customer_name,customer_phone,service_type,current_status,monto_total,created_at
3fa85f64-5717-4562-b3fc-2c963f66afa6,DL-4409,Juan Pérez,+584241234567,DELIVERY,DELIVERED,25.50,2026-01-30T14:30:00.000Z
4fa85f64-5717-4562-b3fc-2c963f66afa7,DL-4410,Maria García,+584249876543,PICKUP,IN_KITCHEN,18.00,2026-01-30T15:00:00.000Z
```

#### Uso Típico

- Exportación para análisis en Excel
- Reportes contables
- Backup de datos
- Integración con sistemas externos

#### Notas Importantes

- El nombre del archivo incluye la fecha de generación
- El encoding es UTF-8
- Los separadores son comas (,)
- Headers incluyen todos los campos principales de órdenes

---

## 📋 Logs de Auditoría - Documentación Completa

### 🔍 Endpoint Principal: Listado General de Logs

**GET /api/dp/v1/logs**

Documentación exhaustiva del sistema de logs y auditoría.

#### Características Principales

- ✅ Sin filtros devuelve todos los logs (Live Feed)
- ✅ Soporta múltiples filtros combinados
- ✅ Paginación incluida
- ✅ Escalable - fácil agregar nuevos filtros

---

### 📊 Parámetros Detallados

#### 1. resource - Filtro por Tipo de Recurso

| Propiedad | Valor |
|-----------|-------|
| Tipo | `string` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Valores permitidos | `orders`, `zones`, `thresholds` |
| Valor por defecto | `null` (sin filtro) |

**Descripción:** Filtra los logs por el tipo de recurso sobre el que se realizó la acción.

**Valores:**
- `orders` - Solo logs relacionados con órdenes (creación, cambios de estado, asignaciones)
- `zones` - Solo logs de zonas de entrega (activación, desactivación, modificaciones)
- `thresholds` - Solo logs de umbrales/configuraciones

**Ejemplos:**
```http
# Solo logs de órdenes
GET /api/dp/v1/logs?resource=orders

# Solo logs de zonas
GET /api/dp/v1/logs?resource=zones

# Solo logs de thresholds
GET /api/dp/v1/logs?resource=thresholds
```

---

#### 2. status - Filtro por Estado de Transición

| Propiedad | Valor |
|-----------|-------|
| Tipo | `string` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Valores permitidos | `PENDING_REVIEW`, `IN_KITCHEN`, `READY_FOR_DISPATCH`, `EN_ROUTE`, `DELIVERED`, `CANCELLED`, `ACTION` |
| Valor por defecto | `null` (sin filtro) |

**Descripción:** Filtra los logs por el estado destino (`status_to`) de la transición registrada.

**Valores:**
- `PENDING_REVIEW` - Orden creada, esperando aprobación
- `IN_KITCHEN` - Orden aprobada, en cocina
- `READY_FOR_DISPATCH` - Orden lista para ser despachada
- `EN_ROUTE` - Orden en camino al cliente
- `DELIVERED` - Orden entregada exitosamente
- `CANCELLED` - Orden cancelada
- `ACTION` - Acción genérica del sistema (POST, PATCH, etc.)

**Ejemplos:**
```http
# Solo logs de órdenes entregadas
GET /api/dp/v1/logs?status=DELIVERED

# Solo acciones genéricas
GET /api/dp/v1/logs?status=ACTION
```

---

#### 3. from - Fecha Inicio del Rango

| Propiedad | Valor |
|-----------|-------|
| Tipo | `string` (ISO 8601 date-time) |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Formato | `YYYY-MM-DDTHH:mm:ss.sssZ` |
| Valor por defecto | `null` (sin límite inferior) |

**Descripción:** Filtra logs cuyo `timestamp_transition` sea mayor o igual a la fecha especificada.

**Formato ISO 8601:**
```
2026-01-30T14:00:00.000Z
```

**Ejemplos:**
```http
# Logs desde el 30 de enero de 2026
GET /api/dp/v1/logs?from=2026-01-30T00:00:00.000Z

# Logs de las últimas 24 horas
GET /api/dp/v1/logs?from=2026-01-29T14:00:00.000Z
```

---

#### 4. to - Fecha Fin del Rango

| Propiedad | Valor |
|-----------|-------|
| Tipo | `string` (ISO 8601 date-time) |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Formato | `YYYY-MM-DDTHH:mm:ss.sssZ` |
| Valor por defecto | `null` (sin límite superior) |

**Descripción:** Filtra logs cuyo `timestamp_transition` sea menor o igual a la fecha especificada.

**Ejemplos:**
```http
# Logs hasta el 30 de enero de 2026 a las 12:00
GET /api/dp/v1/logs?to=2026-01-30T12:00:00.000Z

# Logs en un rango específico
GET /api/dp/v1/logs?from=2026-01-29T00:00:00.000Z&to=2026-01-30T00:00:00.000Z
```

---

#### 5. limit - Límite de Resultados

| Propiedad | Valor |
|-----------|-------|
| Tipo | `integer` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Rango permitido | 1 - 500 |
| Valor por defecto | `50` |

**Descripción:** Número máximo de logs a retornar en la respuesta.

**Uso:**
- Para Live Feed: usar límites menores (10-50)
- Para reportes: usar límites mayores (100-500)
- Combinar con offset para paginación

**Ejemplos:**
```http
# Primeros 10 logs
GET /api/dp/v1/logs?limit=10

# Primeros 100 logs de orders
GET /api/dp/v1/logs?resource=orders&limit=100
```

---

#### 6. offset - Desplazamiento para Paginación

| Propiedad | Valor |
|-----------|-------|
| Tipo | `integer` |
| Ubicación | Query parameter |
| Requerido | ❌ No (opcional) |
| Rango permitido | ≥ 0 |
| Valor por defecto | `0` |

**Descripción:** Número de registros a saltar antes de comenzar a retornar resultados. Se usa para implementar paginación.

**Paginación:**
```http
# Página 1 (primeros 50)
GET /api/dp/v1/logs?limit=50&offset=0

# Página 2 (registros 51-100)
GET /api/dp/v1/logs?limit=50&offset=50

# Página 3 (registros 101-150)
GET /api/dp/v1/logs?limit=50&offset=100
```

---

### 🔗 Combinación de Filtros

Puedes combinar múltiples parámetros para filtros más específicos:

#### Ejemplos de Combinaciones

**1. Órdenes entregadas hoy:**
```http
GET /api/dp/v1/logs?resource=orders&status=DELIVERED&from=2026-01-30T00:00:00.000Z
```

**2. Acciones en zonas en las últimas 2 horas:**
```http
GET /api/dp/v1/logs?resource=zones&status=ACTION&from=2026-01-30T12:00:00.000Z
```

**3. Paginación de logs de thresholds:**
```http
GET /api/dp/v1/logs?resource=thresholds&limit=25&offset=0
```

**4. Reporte de órdenes canceladas en un día específico:**
```http
GET /api/dp/v1/logs?resource=orders&status=CANCELLED&from=2026-01-29T00:00:00.000Z&to=2026-01-30T00:00:00.000Z
```

---

### 📤 Formato de Respuesta - Logs

#### Objeto Log (Schema)

```json
{
  "log_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "order_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "timestamp_transition": "2026-01-30T18:21:03.673Z",
  "status_from": "PENDING_REVIEW",
  "status_to": "IN_KITCHEN",
  "cancellation_reason": null,
  "http_method": "PATCH",
  "path": "/api/dp/v1/orders/abc123/status",
  "resource": "orders",
  "logs_type": "orders",
  "manager": "Jhon - admin@charlotte.com",
  "manager_display": "Jhon - admin@charlotte.com",
  "order": {
    "order_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "readable_id": "DL-4409",
    "current_status": "IN_KITCHEN"
  }
}
```

#### Descripción de Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `log_id` | UUID | Identificador único del log |
| `order_id` | UUID \| null | ID de la orden relacionada (null para logs de zones/thresholds) |
| `timestamp_transition` | ISO DateTime | Momento exacto en que ocurrió el evento |
| `status_from` | string \| null | Estado anterior (null para creaciones) |
| `status_to` | string | Estado nuevo o tipo de acción |
| `cancellation_reason` | string \| null | Razón de cancelación (solo para órdenes canceladas) |
| `http_method` | string \| null | Método HTTP usado (POST, PATCH, DELETE, etc.) |
| `path` | string \| null | Ruta del endpoint llamado |
| `resource` | string \| null | Recurso afectado (orders, zones, thresholds) |
| `logs_type` | enum \| null | Tipo de log (orders, zones, thresholds) - se asigna automáticamente |
| `manager` | string \| null | Nombre y email del usuario que realizó la acción |
| `manager_display` | string \| null | Información del manager almacenada |
| `order` | object \| null | Objeto completo de la orden (si aplica) |

---

### 💡 Casos de Uso Comunes

#### 1. Dashboard en Tiempo Real (Live Feed)
```http
GET /api/dp/v1/logs?limit=20
# Polling cada 5 segundos para ver últimas acciones
```

#### 2. Auditoría de Órdenes del Día
```http
GET /api/dp/v1/logs?resource=orders&from=2026-01-30T00:00:00.000Z&limit=500
```

#### 3. Filtro por Tipo en UI con Tabs
```javascript
const tabs = ['all', 'orders', 'zones', 'thresholds'];
const selectedTab = 'orders';

const url = selectedTab === 'all'
  ? '/api/dp/v1/logs'
  : `/api/dp/v1/logs?resource=${selectedTab}`;
```

#### 4. Historial de Cambios de Configuración
```http
GET /api/dp/v1/logs?resource=zones&status=ACTION
GET /api/dp/v1/logs?resource=thresholds&status=ACTION
```

#### 5. Reporte de Órdenes Canceladas
```http
GET /api/dp/v1/logs?resource=orders&status=CANCELLED&from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.999Z
```

---

### ⚠️ Notas Importantes

#### Ordenamiento
- Los logs se retornan ordenados por `timestamp_transition` **descendente** (más reciente primero)
- Excepto en `/logs/by-order/{order_id}` donde se ordenan **ascendente** (cronológico)

#### Rendimiento
- Usar `limit` apropiado según el caso de uso:
  - Para Live Feed: limit=10-50
  - Para reportes: limit=100-500
- Implementar paginación para grandes volúmenes

#### Valores Null
- `logs_type` puede ser null para logs creados antes de la migración
- `order_id` es null para logs de zones y thresholds
- `status_from` es null para creaciones y acciones genéricas

#### Seguridad
- El campo `manager` se calcula desde el JWT si no está persistido
- Los logs son inmutables - solo lectura
- No hay endpoints para modificar o eliminar logs

---

## 🔐 Autenticación

> **Nota:** La mayoría de endpoints requieren autenticación vía JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

El sistema decodifica el JWT automáticamente en cada request mediante el middleware `decodeJwtAlways`.

---

## ⚡ Códigos de Estado Comunes

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Eliminación exitosa |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - Token inválido o ausente |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto de unicidad |
| 500 | Internal Server Error - Error del servidor |
| 502 | Bad Gateway - Error de servicio externo |

---

## 📌 Notas Generales

1. **Base URL:** Todos los endpoints están bajo `/api/dp/v1`
2. **Formato de fechas:** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
3. **UUIDs:** Todos los IDs son UUID v4
4. **Paginación:** Disponible en endpoints de listado mediante `limit` y `offset`
5. **CORS:** Configurado según whitelist del entorno
6. **Content-Type:** Todas las respuestas son `application/json` (excepto exports)
7. **Ordenamiento:** Por defecto descendente por fecha de creación/actualización

---

## 🔄 Versionado

**Versión actual:** v1

El sistema usa versionado de URL (`/api/dp/v1/...`) para mantener compatibilidad hacia atrás.

---

## 📚 Recursos Adicionales

- **Swagger/OpenAPI:** Disponible en `/api-docs` (si está montado)
- **Monitoreo:** Dashboard Metrex en `/metrex`
- **Health Check:** `/health`

---

**Última actualización:** 2026-01-31  
**Versión de documentación:** 1.0.0
