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

async function createOrder(payload) {
  const { Notes, NoteItems, Logs, Zones } = getModels();

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

  // Create order in Kitchen first (so if it fails, we don't persist DP order)
  const externalOrderId = isKitchenLike ? dpPayload._kitchenOrder.externalOrderId : randomUUID();
  const kitchenOrderPayload = isKitchenLike
    ? dpPayload._kitchenOrder
    : {
        externalOrderId,
        sourceModule: 'DP_MODULE',
        serviceMode: dpPayload.service_type === 'DELIVERY' ? 'DELIVERY' : 'PICKUP',
        displayLabel: readable_id,
        customerName: dpPayload.customer?.name,
        items: (dpPayload.items || []).map((it) => ({
          productId: String(it.product_id),
          quantity: it.quantity,
          notes: it.notes,
        })),
      };

  const kitchenOrderRes = await createKitchenOrder(kitchenOrderPayload);
  const kitchenOrderId =
    kitchenOrderRes?.data?.id ??
    kitchenOrderRes?.data?.orderId ??
    kitchenOrderRes?.data?.externalOrderId ??
    kitchenOrderRes?.data?.external_order_id ??
    kitchenOrderRes?.id ??
    kitchenOrderRes?.orderId ??
    kitchenOrderRes?.externalOrderId ??
    externalOrderId;

  const noteId = randomUUID();
  const note = await Notes.create({
    note_id: noteId,
    readable_id,
    order_source_id: String(kitchenOrderId),
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
    note_id: note.note_id,
    product_name: it.product_name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    subtotal: (Number(it.unit_price) * Number(it.quantity)).toFixed(2),
  }));
  await NoteItems.bulkCreate(itemsToCreate);

  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from: null, status_to: 'PENDING_REVIEW' });

  return { note_id: note.note_id, readable_id, status: note.current_status };
}

async function webhookKitchenReady(readable_id) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findOne({ where: { readable_id } });
  if (!note) return null;
  const prev = note.current_status;
  await note.update({ current_status: 'READY_FOR_DISPATCH', timestamp_ready: new Date() });
  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from: prev, status_to: 'READY_FOR_DISPATCH' });
  console.log(`[SIM] Notify customer for ${readable_id}: READY_FOR_DISPATCH`);
  return { readable_id: note.readable_id, status: 'READY_FOR_DISPATCH' };
}

/**
 * Admin: cambio de estado por estado destino.
 * Actualiza timestamps según el status destino y registra log.
 */
async function setOrderStatus(note_id, status_to) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;

  const status_from = note.current_status;
  if (status_from === status_to) {
    return { note_id: note.note_id, readable_id: note.readable_id, status: note.current_status };
  }

  const allowedNext = VALID_TRANSITIONS?.[status_from] ?? [];
  if (!allowedNext.includes(status_to)) {
    const err = new Error(`Invalid status transition: ${status_from} -> ${status_to}`);
    err.statusCode = 400;
    err.details = { from: status_from, to: status_to, allowed: allowedNext };
    throw err;
  }

  const now = new Date();
  const timestamps = {};
  if (status_to === 'IN_KITCHEN') timestamps.timestamp_approved = now;
  if (status_to === 'READY_FOR_DISPATCH') timestamps.timestamp_ready = now;
  if (status_to === 'EN_ROUTE') timestamps.timestamp_dispatched = now;
  if (status_to === 'DELIVERED') timestamps.timestamp_closure = now;

  await note.update({ current_status: status_to, ...timestamps });
  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from, status_to });

  return { note_id: note.note_id, readable_id: note.readable_id, status: status_to };
}

async function listOrdersByStatus() {
  const { Notes } = getModels();
  const notes = await Notes.findAll({ order: [['timestamp_creation', 'DESC']] });
  const columns = {
    PENDING_REVIEW: [],
    IN_KITCHEN: [],
    READY_FOR_DISPATCH: [],
    EN_ROUTE: [],
    DELIVERED: [],
    CANCELLED: [],
  };
  for (const n of notes) {
    (columns[n.current_status] || (columns[n.current_status] = [])).push({
      note_id: n.note_id,
      readable_id: n.readable_id,
      customer_name: n.customer_name,
      service_type: n.service_type,
      current_status: n.current_status,
      created_at: n.timestamp_creation,
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
  const { Notes } = getModels();
  const where = {};

  if (filters.status) {
    where.current_status = filters.status;
  }

  if (filters.date) {
    const now = new Date();
    let start;
    let end;
    if (filters.date === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else {
      // Expect YYYY-MM-DD
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(filters.date);
      if (m) {
        const [y, mo, d] = filters.date.split('-').map((x) => Number(x));
        start = new Date(y, mo - 1, d);
        end = new Date(y, mo - 1, d + 1);
      }
    }
    if (start && end) {
      where.timestamp_creation = { [Op.gte]: start, [Op.lt]: end };
    }
  }

  const notes = await Notes.findAll({ where, order: [['timestamp_creation', 'DESC']] });
  return notes;
}

/**
 * Admin: listado de órdenes activas.
 * Activas = todas excepto CANCELLED y DELIVERED.
 * @param {{ date?: string }} filters
 */
async function listActiveOrders(filters = {}) {
  const { Notes } = getModels();
  const where = {
    current_status: { [Op.notIn]: ['CANCELLED', 'DELIVERED'] },
  };

  if (filters.date) {
    const now = new Date();
    let start;
    let end;
    if (filters.date === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else {
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(filters.date);
      if (m) {
        const [y, mo, d] = filters.date.split('-').map((x) => Number(x));
        start = new Date(y, mo - 1, d);
        end = new Date(y, mo - 1, d + 1);
      }
    }
    if (start && end) {
      where.timestamp_creation = { [Op.gte]: start, [Op.lt]: end };
    }
  }

  const notes = await Notes.findAll({ where, order: [['timestamp_creation', 'DESC']] });
  return notes;
}

/**
 * Admin: detalle completo de una orden.
 * Incluye items, logs y zona (si existe).
 */
async function getOrderDetail(note_id) {
  const { Notes, NoteItems, Logs, Zones, Managers } = getModels();
  const note = await Notes.findByPk(note_id, {
    include: [
      { model: NoteItems, as: 'items' },
      { model: Logs, as: 'logs', include: [{ model: Managers, as: 'manager' }] },
      { model: Zones, as: 'zone', required: false },
    ],
    order: [[{ model: Logs, as: 'logs' }, 'timestamp_transition', 'ASC']],
  });
  return note;
}

/**
 * Detalle completo de una orden por readable_id.
 * Útil cuando el cliente/externo maneja un ID legible (ej: DL-1234).
 */
async function getOrderDetailByReadableId(readable_id) {
  const { Notes, NoteItems, Logs, Zones, Managers } = getModels();
  const note = await Notes.findOne({
    where: { readable_id },
    include: [
      { model: NoteItems, as: 'items' },
      { model: Logs, as: 'logs', include: [{ model: Managers, as: 'manager' }] },
      { model: Zones, as: 'zone', required: false },
    ],
    order: [[{ model: Logs, as: 'logs' }, 'timestamp_transition', 'ASC']],
  });
  return note;
}

/**
 * Admin: correcciones de datos de la orden.
 * Modifica campos editables en Notes.
 */
async function patchOrder(note_id, payload) {
  const { Notes } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;
  await note.update(payload);
  return note;
}

/**
 * Admin: asignar motorizado.
 * Nota: No existe tabla/campo de drivers en este proyecto aún.
 * Como fallback, registramos la asignación como un log (manager_id) y opcionalmente un texto.
 */
async function assignOrder(note_id, payload) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;

  const prev = note.current_status;

  // No cambiamos estado por defecto (no estaba definido un status de "ASSIGNED").
  // Si luego se agrega, esto puede evolucionar.

  await Logs.create({
    log_id: randomUUID(),
    note_id: note.note_id,
    manager_id: payload.manager_id || null,
    status_from: prev,
    status_to: prev,
    cancellation_reason: payload.note || null,
  });

  return { note_id: note.note_id, readable_id: note.readable_id, assigned_to: payload.manager_id || null };
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
