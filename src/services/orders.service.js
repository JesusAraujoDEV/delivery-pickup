import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';

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

async function getAndAdvanceStatus(readable_id) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findOne({ where: { readable_id } });
  if (!note) return null;

  const currentIndex = STATUS_FLOW.indexOf(note.current_status);
  const nextIndex = Math.min(currentIndex + 1, STATUS_FLOW.length - 1);
  const nextStatus = STATUS_FLOW[nextIndex];

  if (nextStatus !== note.current_status) {
    const now = new Date();
    const timestamps = {};
    if (nextStatus === 'IN_KITCHEN') timestamps.timestamp_approved = now;
    if (nextStatus === 'READY_FOR_DISPATCH') timestamps.timestamp_ready = now;
    if (nextStatus === 'EN_ROUTE') timestamps.timestamp_dispatched = now;
    if (nextStatus === 'DELIVERED') timestamps.timestamp_closure = now;

    await note.update({ current_status: nextStatus, ...timestamps });
    await Logs.create({ note_id: note.note_id, status_from: STATUS_FLOW[currentIndex], status_to: nextStatus });
  }

  return { readable_id, status: nextStatus };
}

async function approveOrder(note_id) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;

  const prev = note.current_status;
  await note.update({ current_status: 'IN_KITCHEN', timestamp_approved: new Date() });
  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from: prev, status_to: 'IN_KITCHEN' });

  // Simulate POST /api/kitchen/v1/queue/inject
  // In future, perform axios/fetch here. For now, just console log.
  console.log(`[SIM] Kitchen inject for note ${note.readable_id}`);

  return { readable_id: note.readable_id, status: 'IN_KITCHEN' };
}

async function cancelOrder(note_id, reason) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;

  const prev = note.current_status;
  await note.update({ current_status: 'CANCELLED' });
  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from: prev, status_to: 'CANCELLED', cancellation_reason: reason || null });
  return { readable_id: note.readable_id, status: 'CANCELLED' };
}

async function dispatchOrder(note_id) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;

  const prev = note.current_status;
  await note.update({ current_status: 'EN_ROUTE', timestamp_dispatched: new Date() });
  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from: prev, status_to: 'EN_ROUTE' });
  return { readable_id: note.readable_id, status: 'EN_ROUTE' };
}

async function closeOrder(note_id) {
  const { Notes, Logs } = getModels();
  const note = await Notes.findByPk(note_id);
  if (!note) return null;

  const prev = note.current_status;
  await note.update({ current_status: 'DELIVERED', timestamp_closure: new Date() });
  await Logs.create({ log_id: randomUUID(), note_id: note.note_id, status_from: prev, status_to: 'DELIVERED' });
  return { readable_id: note.readable_id, status: 'DELIVERED' };
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

export default {
  createOrder,
  getAndAdvanceStatus,
  approveOrder,
  cancelOrder,
  dispatchOrder,
  closeOrder,
  webhookKitchenReady,
  listOrdersByStatus,
};
