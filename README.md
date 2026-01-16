# Delivery & Pickup API (Express + Sequelize)

Backend para Delivery/Pickup con integración simulada a Cocina. Expone endpoints para catálogo, órdenes, dashboard, webhooks y reportes. Arquitectura por capas con Express, Sequelize (Postgres) y validaciones con Joi.

## Requisitos

- Node.js 18+
- PostgreSQL 13+

## Instalación

1. Copia el archivo .env.example a .env y ajusta tus credenciales de Postgres.
2. Instala dependencias.
3. Inicia el servidor en modo desarrollo.

## Comandos (PowerShell)

```powershell
npm install
copy .env.example .env
npm run dev
```

## Estructura

- `src/server.js`: arranque del servidor.
- `src/config/sequelize.js`: conexión y sync de modelos.
- `src/models/*`: modelos Sequelize (dp_*).
- `src/routes/*`: rutas divididas por dominio.
- `src/controllers/*`: capa de controladores HTTP.
- `src/services/*`: lógica de negocio (incluye simulaciones de cocina).

## Base de datos

Los modelos reflejan el esquema compartido (dp_orders, dp_order_items, dp_logs, etc.). `sequelize.sync()` crea tablas si no existen (solo para demo). En producción, usa migraciones.

### Conexión a Postgres con SSL (CA) como en Mediart

Este proyecto replica la estrategia del backend de Mediart para conectarse a Postgres usando SSL con certificado de Autoridad (CA):

- Puedes definir una URL de conexión (`DB_URL`) o bien usar los parámetros discretos (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`).
- Activa SSL con `DB_SSL=true`.
- Proporciona el certificado CA mediante:
  - `DB_SSL_CA` con el contenido del certificado, o
  - `DB_SSL_CA_PATH` con la ruta del archivo.
- En producción, si no defines `DB_SSL_CA` ni `DB_SSL_CA_PATH`, el proyecto intentará usar `certs/aiven-ca.pem` automáticamente.
- Las migraciones (`sequelize-cli`) usan `src/db/config.cjs` y respetan `DB_SSL` en cualquier entorno (development/test/production). Si `DB_SSL=1`, se establecerá `dialectOptions.ssl` y se intentará cargar el CA desde `DB_SSL_CA_PATH` o `DB_SSL_CA`.

Ejemplo `.env` (PowerShell):

```powershell
# Opción 1: URL (similar a Mediart)
DB_URL="postgres://user:pass@host:port/dbname?sslmode=require"
DB_SSL=true
DB_SSL_CA_PATH=certs/aiven-ca.pem

# Opción 2: parámetros sueltos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=delivery_pickup
DB_USER=postgres
DB_PASS=postgres
DB_SSL=false
```

Prueba rápida de conexión (usa tus variables reales):

```powershell
npm run db:test
```

## Endpoints clave

- GET `/api/dp/v1/catalog` → Proxy simulado del menú de Cocina (con caché en memoria 60s).
- POST `/api/dp/v1/orders` → Crea orden (validación con Joi, stock simulado), guarda items y log inicial.
- GET `/api/dp/v1/orders/{readable_id}/status` → Avanza el estado en cada consulta: PENDING_REVIEW → IN_KITCHEN → READY_FOR_DISPATCH → EN_ROUTE → DELIVERED.
- GET `/api/dp/v1/dashboard/orders` → Lista agrupada por estado.
- POST `/api/dp/v1/orders/{order_id}/approve` → Cambia a IN_KITCHEN y simula POST a Cocina.
- POST `/api/dp/v1/orders/{order_id}/cancel` → Cancela.
- PUT `/api/dp/v1/orders/{order_id}/dispatch` → EN_ROUTE.
- PUT `/api/dp/v1/orders/{order_id}/close` → DELIVERED.
- POST `/api/dp/v1/webhooks/kitchen/ready` → Webhook que marca READY_FOR_DISPATCH y notifica (simulado).
- GET `/api/dp/v1/reports/export` → CSV con resumen de notas.

## Notas de simulación

- Catálogo y validación de stock se simulan hasta que exista el API de Cocina.
- El POST de inyección a Cocina al aprobar es un console.log.
- Las notificaciones al cliente en el Webhook son console.log.

## Estados

`PENDING_REVIEW`, `IN_KITCHEN`, `READY_FOR_DISPATCH`, `EN_ROUTE`, `DELIVERED`, `CANCELLED`.

## Prueba rápida (PowerShell)

1. Crear orden:

```powershell
curl -Method POST -Uri http://localhost:3000/api/dp/v1/orders -ContentType 'application/json' -Body '{
  "service_type":"DELIVERY",
  "zone_id":"35f5a507-0eb3-4c78-a43d-cf0da720cf2d",
  "customer":{"name":"Juan","phone":"555-123","email":"juan@example.com","address":"Calle 1"},
  "items":[{"product_id":"a5eccd9f-8b62-4ba5-ac9e-21ca43199718","product_name":"Hamburguesa Royal","quantity":2,"unit_price":25}]
}'

# Nota: "shipping_cost" no es requerido; el backend lo calcula desde la zona (dp_zones.shipping_cost).
```

1. Consultar/avanzar estado:

```powershell
# Reemplaza DL-XXXX con el readable_id retornado
curl http://localhost:3000/api/dp/v1/orders/DL-XXXX/status
```
