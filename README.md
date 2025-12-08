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

Los modelos reflejan el esquema compartido (dp_notes, dp_note_items, dp_logs, etc.). `sequelize.sync()` crea tablas si no existen (solo para demo). En producción, usa migraciones.

## Endpoints clave

- GET `/api/dp/v1/catalog` → Proxy simulado del menú de Cocina (con caché en memoria 60s).
- POST `/api/dp/v1/orders` → Crea orden (validación con Joi, stock simulado), guarda items y log inicial.
- GET `/api/dp/v1/orders/{readable_id}/status` → Avanza el estado en cada consulta: PENDING_REVIEW → IN_KITCHEN → READY_FOR_DISPATCH → EN_ROUTE → DELIVERED.
- GET `/api/dp/v1/dashboard/orders` → Lista agrupada por estado.
- POST `/api/dp/v1/orders/{note_id}/approve` → Cambia a IN_KITCHEN y simula POST a Cocina.
- POST `/api/dp/v1/orders/{note_id}/cancel` → Cancela.
- PUT `/api/dp/v1/orders/{note_id}/dispatch` → EN_ROUTE.
- PUT `/api/dp/v1/orders/{note_id}/close` → DELIVERED.
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
  "customer":{"name":"Juan","phone":"555-123","email":"juan@example.com","address":"Calle 1"},
  "items":[{"product_id":"K-100","product_name":"Hamburguesa Clásica","quantity":2,"unit_price":5.99}],
  "shipping_cost":2.50
}'
```

1. Consultar/avanzar estado:

```powershell
# Reemplaza DL-XXXX con el readable_id retornado
curl http://localhost:3000/api/dp/v1/orders/DL-XXXX/status
```
