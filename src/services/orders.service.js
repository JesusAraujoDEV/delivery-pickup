import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { VALID_TRANSITIONS } from '../schemas/orders.schemas.js';

const STATUS_FLOW = ['PENDING_REVIEW', 'IN_KITCHEN', 'READY_FOR_DISPATCH', 'EN_ROUTE', 'DELIVERED'];

function generateReadableId() {
  // Simple human-readable id: DL-XXXX
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DL-${num}`;
}

async function createOrder(payload) {
  const { Notes, NoteItems, Logs } = getModels();

  // Sum items
  const itemsTotal = payload.items.reduce((acc, it) => acc + Number(it.unit_price) * Number(it.quantity), 0);
  const total = itemsTotal + Number(payload.shipping_cost);

  // Simulated stock validation (always true while kitchen API doesn't exist)
  // In future: call GET /inventory/availability/{id}

  const readable_id = generateReadableId();

  const noteId = randomUUID();
  const note = await Notes.create({
    note_id: noteId,
    readable_id,
    order_source_id: null,
    customer_name: payload.customer.name,
    customer_phone: payload.customer.phone,
    customer_email: payload.customer.email,
    delivery_address: payload.customer.address,
    service_type: payload.service_type,
    current_status: 'PENDING_REVIEW',
    monto_total: total.toFixed(2),
    monto_costo_envio: Number(payload.shipping_cost).toFixed(2),
    zone_id: payload.zone_id || null,
  });

  const itemsToCreate = payload.items.map((it) => ({
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
  patchOrder,
  assignOrder,
  setOrderStatus,
};
