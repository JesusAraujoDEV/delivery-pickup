import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { VALID_TRANSITIONS } from '../schemas/orders.schemas.js';
import { createKitchenOrder, fetchKitchenProducts, validateOrderItemsAgainstKitchenProducts } from './kitchen.service.js';

function generateReadableId() {
  // Simple human-readable id: DL-XXXX
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DL-${num}`;
}

function buildUtcDayRange(dateStr) {
  const now = new Date();

  if (dateStr === 'today') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return { start, end };
  }

  const m = /^\d{4}-\d{2}-\d{2}$/.exec(dateStr);
  if (!m) return null;
  const [y, mo, d] = dateStr.split('-').map((x) => Number(x));
  if (!y || !mo || !d) return null;

  const start = new Date(Date.UTC(y, mo - 1, d));
  const end = new Date(Date.UTC(y, mo - 1, d + 1));
  return { start, end };
}

async function createOrder(payload) {
  const { Orders, OrderItems, Logs, Zones } = getModels();

  // Support two input shapes:
  // 1) DP shape: { service_type, zone_id, customer:{...}, items:[{product_id,product_name,quantity,unit_price}], shipping_cost? }
  // 2) Kitchen-like shape:
  //    { externalOrderId, sourceModule, serviceMode, displayLabel, customerName, zone_id, items:[{productId,quantity,notes}] }
  const isKitchenLike = payload && Array.isArray(payload.items) && payload.items.length > 0 && payload.items[0].productId;

  const dpPayload = isKitchenLike
    ? {
        service_type: 'PICKUP',
        zone_id: payload.zone_id,
        customer: {
          name: payload.customerName || 'Cliente',
          phone: 'N/A',
          email: 'n/a@example.com',
          address: '',
        },
        // Map kitchen-like items to DP-style items. Prices will be filled from Kitchen catalog.
        items: payload.items.map((it) => ({
          product_id: String(it.productId),
          product_name: String(it.productId),
          quantity: it.quantity,
          unit_price: 0,
          notes: it.notes,
        })),
        shipping_cost: 0,
        _kitchenOrder: {
          externalOrderId: payload.externalOrderId,
          sourceModule: payload.sourceModule,
          serviceMode: payload.serviceMode,
          displayLabel: payload.displayLabel,
          customerName: payload.customerName,
          items: payload.items,
        },
      }
    : payload;

  if (!dpPayload?.zone_id) {
    const err = new Error('zone_id is required');
    err.statusCode = 400;
    throw err;
  }

  const zone = await Zones.findByPk(dpPayload.zone_id);
  if (!zone) {
    const err = new Error('Zone not found');
    err.statusCode = 400;
    err.details = { zone_id: dpPayload.zone_id };
    throw err;
  }
  if (zone.is_active === false) {
    const err = new Error('Zone is inactive');
    err.statusCode = 400;
    err.details = { zone_id: dpPayload.zone_id };
    throw err;
  }

  const derivedShippingCost = Number(zone.shipping_cost);
  if (Number.isNaN(derivedShippingCost)) {
    const err = new Error('Zone shipping_cost is invalid');
    err.statusCode = 500;
    err.details = { zone_id: dpPayload.zone_id, shipping_cost: zone.shipping_cost };
    throw err;
  }

  // Kitchen validation: ensure products exist and are active
  const kitchenProducts = await fetchKitchenProducts();
  const byId = new Map(kitchenProducts.map((p) => [String(p.id), p]));

  // If this request didn't provide unit_price/product_name (kitchen-like), fill them from kitchen catalog.
  if (isKitchenLike) {
    dpPayload.items = dpPayload.items.map((it) => {
      const p = byId.get(String(it.product_id));
      return {
        ...it,
        product_name: p?.name ?? it.product_name,
        unit_price: Number(p?.basePrice ?? it.unit_price ?? 0),
      };
    });
  }

  const validation = validateOrderItemsAgainstKitchenProducts(dpPayload.items, kitchenProducts, {
    fallbackByName: false,
  });

  if (!validation.ok) {
    const err = new Error('One or more order items are invalid in Kitchen products catalog');
    err.statusCode = 400;
    err.details = { invalidItems: validation.invalid };
    throw err;
  }

  // Override any provided shipping_cost with the zone-derived value
  dpPayload.shipping_cost = derivedShippingCost;

  const itemsTotal = dpPayload.items.reduce((acc, it) => acc + Number(it.unit_price) * Number(it.quantity), 0);
  const total = itemsTotal + derivedShippingCost;

  const readable_id = generateReadableId();

  // Importante: ya no inyectamos en Cocina al crear.
  // La inyección se hace cuando el admin cambia el status a READY_FOR_DISPATCH.

  const orderId = randomUUID();
  const order = await Orders.create({
    order_id: orderId,
    readable_id,
    customer_name: dpPayload.customer.name,
    customer_phone: dpPayload.customer.phone,
    customer_email: dpPayload.customer.email,
    delivery_address: dpPayload.customer.address,
    service_type: dpPayload.service_type,
    current_status: 'PENDING_REVIEW',
    monto_total: total.toFixed(2),
    monto_costo_envio: derivedShippingCost.toFixed(2),
    zone_id: dpPayload.zone_id,
  });

  const itemsToCreate = dpPayload.items.map((it) => ({
    item_id: randomUUID(),
    order_id: order.order_id,
    product_name: it.product_name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    subtotal: (Number(it.unit_price) * Number(it.quantity)).toFixed(2),
    notes: it.notes ?? null,
  }));
  await OrderItems.bulkCreate(itemsToCreate);

  await Logs.create({ log_id: randomUUID(), order_id: order.order_id, status_from: null, status_to: 'PENDING_REVIEW' });

  return { order_id: order.order_id, readable_id, status: order.current_status };
}

async function webhookKitchenReady(readable_id) {
  const { Orders, Logs } = getModels();
  const order = await Orders.findOne({ where: { readable_id } });
  if (!order) return null;
  const prev = order.current_status;
  await order.update({ current_status: 'READY_FOR_DISPATCH', timestamp_ready: new Date() });
  await Logs.create({ log_id: randomUUID(), order_id: order.order_id, status_from: prev, status_to: 'READY_FOR_DISPATCH' });
  console.log(`[SIM] Notify customer for ${readable_id}: READY_FOR_DISPATCH`);
  return { readable_id: order.readable_id, status: 'READY_FOR_DISPATCH' };
}

/**
 * Admin: cambio de estado por estado destino.
 * Actualiza timestamps según el status destino y registra log.
 */
async function setOrderStatus(order_id, status_to) {
  const { Orders, OrderItems, Logs } = getModels();

  const isReadable = typeof order_id === 'string' && /^DL-\d+$/i.test(order_id);
  const order = isReadable
    ? await Orders.findOne({ where: { readable_id: order_id } })
    : await Orders.findByPk(order_id);
  if (!order) return null;

  const status_from = order.current_status;
  if (status_from === status_to) {
    return { order_id: order.order_id, readable_id: order.readable_id, status: order.current_status };
  }

  const allowedNext = VALID_TRANSITIONS?.[status_from] ?? [];
  if (!allowedNext.includes(status_to)) {
    const err = new Error(`Invalid status transition: ${status_from} -> ${status_to}`);
    err.statusCode = 400;
    err.details = { from: status_from, to: status_to, allowed: allowedNext };
    throw err;
  }

  // Inyección a Cocina SOLO al pasar a IN_KITCHEN.
  // Si falla, no cambiamos el status en DP (se devuelve 502 desde el controller).
  if (status_to === 'IN_KITCHEN') {
    const items = await OrderItems.findAll({ where: { order_id: order.order_id } });

    // Como se canceló la columna product_id en dp_order_items,
    // resolvemos productId desde el catálogo de Cocina usando product_name.
    const kitchenProducts = await fetchKitchenProducts();
    const byName = new Map(
      (kitchenProducts || []).map((p) => [String(p.name || '').trim().toLowerCase(), p])
    );

    const resolved = [];
    const invalid = [];

    for (const it of items || []) {
      const key = String(it.product_name || '').trim().toLowerCase();
      const p = byName.get(key);
      if (!p) {
        invalid.push({ item_id: it.item_id, product_name: it.product_name, reason: 'NOT_FOUND_BY_NAME' });
        continue;
      }
      if (!p.isActive) {
        invalid.push({ item_id: it.item_id, product_name: it.product_name, reason: 'INACTIVE' });
        continue;
      }
      resolved.push({ it, productId: String(p.id) });
    }

    if (invalid.length > 0) {
      const err = new Error('Cannot inject to Kitchen: one or more items cannot be resolved by product_name');
      err.statusCode = 400;
      err.details = { invalidItems: invalid };
      throw err;
    }

    const kitchenPayload = {
      // Sin order_source_id: usamos el UUID de DP como correlación externa.
      externalOrderId: String(order.order_id),
      sourceModule: 'DP_MODULE',
      serviceMode: order.service_type === 'DELIVERY' ? 'DELIVERY' : 'PICKUP',
      displayLabel: order.readable_id,
      customerName: order.customer_name,
      items: resolved.map(({ it, productId }) => ({
        productId,
        quantity: it.quantity,
        // Cocina valida `notes` como string (no acepta null)
        notes: it.notes == null ? '' : String(it.notes),
      })),
    };

    await createKitchenOrder(kitchenPayload);
  }

  const now = new Date();
  const timestamps = {};
  if (status_to === 'IN_KITCHEN') timestamps.timestamp_approved = now;
  if (status_to === 'READY_FOR_DISPATCH') timestamps.timestamp_ready = now;
  if (status_to === 'EN_ROUTE') timestamps.timestamp_dispatched = now;
  if (status_to === 'DELIVERED') timestamps.timestamp_closure = now;

  await order.update({ current_status: status_to, ...timestamps });
  await Logs.create({ log_id: randomUUID(), order_id: order.order_id, status_from, status_to });

  return { order_id: order.order_id, readable_id: order.readable_id, status: status_to };
}

async function listOrdersByStatus() {
  const { Orders } = getModels();
  const orders = await Orders.findAll({ order: [['timestamp_creation', 'DESC']] });
  const columns = {
    PENDING_REVIEW: [],
    IN_KITCHEN: [],
    READY_FOR_DISPATCH: [],
    EN_ROUTE: [],
    DELIVERED: [],
    CANCELLED: [],
  };
  for (const o of orders) {
    (columns[o.current_status] || (columns[o.current_status] = [])).push({
      order_id: o.order_id,
      readable_id: o.readable_id,
      customer_name: o.customer_name,
      service_type: o.service_type,
      current_status: o.current_status,
      created_at: o.timestamp_creation,
    });
  }
  return columns;
}

/**
 * Admin: listado general de órdenes.
 * @param {{ status?: string, date?: string }} filters
 * - status: filtra por current_status
 * - date: 'today' o 'YYYY-MM-DD' (usa timestamp_creation)
 */
async function listOrders(filters = {}) {
  const { Orders } = getModels();
  const where = {};

  if (filters.status) {
    where.current_status = filters.status;
  }

  if (filters.date) {
    const range = buildUtcDayRange(filters.date);
    if (range?.start && range?.end) where.timestamp_creation = { [Op.gte]: range.start, [Op.lt]: range.end };
  }

  const orders = await Orders.findAll({ where, order: [['timestamp_creation', 'DESC']] });
  return orders;
}

/**
 * Admin: listado de órdenes activas.
 * Activas = todas excepto CANCELLED y DELIVERED.
 * @param {{ date?: string }} filters
 */
async function listActiveOrders(filters = {}) {
  const { Orders } = getModels();
  const where = {
    current_status: { [Op.notIn]: ['CANCELLED', 'DELIVERED'] },
  };

  if (filters.date) {
    const range = buildUtcDayRange(filters.date);
    if (range?.start && range?.end) where.timestamp_creation = { [Op.gte]: range.start, [Op.lt]: range.end };
  }

  const orders = await Orders.findAll({ where, order: [['timestamp_creation', 'DESC']] });
  return orders;
}

/**
 * Admin: detalle completo de una orden.
 * Incluye items, logs y zona (si existe).
 */
async function getOrderDetail(order_id) {
  const { Orders, OrderItems, Logs, Zones, Managers } = getModels();
  const order = await Orders.findByPk(order_id, {
    include: [
      { model: OrderItems, as: 'items' },
      { model: Logs, as: 'logs', include: [{ model: Managers, as: 'manager' }] },
      { model: Zones, as: 'zone', required: false },
    ],
    order: [[{ model: Logs, as: 'logs' }, 'timestamp_transition', 'ASC']],
  });
  return order;
}

/**
 * Detalle completo de una orden por readable_id.
 * Útil cuando el cliente/externo maneja un ID legible (ej: DL-1234).
 */
async function getOrderDetailByReadableId(readable_id) {
  const { Orders, OrderItems, Logs, Zones, Managers } = getModels();
  const order = await Orders.findOne({
    where: { readable_id },
    include: [
      { model: OrderItems, as: 'items' },
      { model: Logs, as: 'logs', include: [{ model: Managers, as: 'manager' }] },
      { model: Zones, as: 'zone', required: false },
    ],
    order: [[{ model: Logs, as: 'logs' }, 'timestamp_transition', 'ASC']],
  });
  return order;
}

/**
 * Admin: correcciones de datos de la orden.
 * Modifica campos editables en Orders.
 */
async function patchOrder(order_id, payload) {
  const { Orders } = getModels();
  const order = await Orders.findByPk(order_id);
  if (!order) return null;
  await order.update(payload);
  return order;
}

/**
 * Admin: asignar motorizado.
 * Nota: No existe tabla/campo de drivers en este proyecto aún.
 * Como fallback, registramos la asignación como un log (manager_id) y opcionalmente un texto.
 */
async function assignOrder(order_id, payload) {
  const { Orders, Logs } = getModels();
  const order = await Orders.findByPk(order_id);
  if (!order) return null;

  const prev = order.current_status;

  // No cambiamos estado por defecto (no estaba definido un status de "ASSIGNED").
  // Si luego se agrega, esto puede evolucionar.

  await Logs.create({
    log_id: randomUUID(),
    order_id: order.order_id,
    manager_id: payload.manager_id || null,
    status_from: prev,
    status_to: prev,
    cancellation_reason: payload.note || null,
  });

  return { order_id: order.order_id, readable_id: order.readable_id, assigned_to: payload.manager_id || null };
}

export default {
  createOrder,
  webhookKitchenReady,
  listOrdersByStatus,
  listOrders,
  listActiveOrders,
  getOrderDetail,
  getOrderDetailByReadableId,
  patchOrder,
  assignOrder,
  setOrderStatus,
};
