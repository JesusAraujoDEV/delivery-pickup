import { getModels } from '../models/index.js';
import { randomUUID } from 'crypto';

function calcSubtotal({ quantity, unit_price }) {
  // quantity es int; unit_price viene como number (aunque en DB sea DECIMAL)
  const subtotal = Number(quantity) * Number(unit_price);
  // 2 decimales para mantener consistencia (DB DECIMAL(10,2))
  return Math.round(subtotal * 100) / 100;
}

export async function listForOrder(order_id) {
  const { OrderIItems } = getModels();
  return OrderItems.findAll({ where: { order_id } });
}

export async function createForOrder(order_id, payload) {
  const { OrderItems } = getModels();
  const item_id = randomUUID();
  const quantity = payload.quantity;
  const unit_price = payload.unit_price;
  const subtotal = payload.subtotal ?? calcSubtotal({ quantity, unit_price });

  const record = await OrderItems.create({
    item_id,
    order_id,
    ...payload,
    subtotal,
  });
  return record;
}

export async function patch(item_id, payload) {
  const { OrderItems } = getModels();
  const record = await OrderItems.findByPk(item_id);
  if (!record) return null;

  const next = { ...payload };
  if ((payload.quantity !== undefined || payload.unit_price !== undefined) && payload.subtotal === undefined) {
    const quantity = payload.quantity ?? record.quantity;
    const unit_price = payload.unit_price ?? record.unit_price;
    next.subtotal = calcSubtotal({ quantity, unit_price });
  }

  await record.update(next);
  return record;
}

export async function remove(item_id) {
  const { OrderItems } = getModels();
  const record = await OrderItems.findByPk(item_id);
  if (!record) return null;
  await record.destroy();
  return true;
}

export default { listForOrder, createForOrder, patch, remove };
