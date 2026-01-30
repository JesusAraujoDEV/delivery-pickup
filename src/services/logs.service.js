import { Op } from 'sequelize';
import { getModels } from '../models/index.js';

function buildTimestampRange(from, to) {
  const where = {};
  if (from && to) {
    where[Op.between] = [new Date(from), new Date(to)];
    return where;
  }
  if (from) {
    where[Op.gte] = new Date(from);
    return where;
  }
  if (to) {
    where[Op.lte] = new Date(to);
    return where;
  }
  return null;
}

async function list({ limit = 50, offset = 0 } = {}) {
  const { Logs, Orders } = getModels();
  const rows = await Logs.findAll({
    include: [
      { model: Orders, as: 'order', required: false },
    ],
    order: [['timestamp_transition', 'DESC']],
    limit,
    offset,
  });
  return rows;
}

async function getById(log_id) {
  const { Logs, Orders } = getModels();
  const row = await Logs.findByPk(log_id, {
    include: [
      { model: Orders, as: 'order', required: false },
    ],
  });
  return row;
}

async function listByOrder(order_id, { limit = 200, offset = 0 } = {}) {
  const { Logs } = getModels();
  const rows = await Logs.findAll({
    where: { order_id },
    order: [['timestamp_transition', 'ASC']],
    limit,
    offset,
  });
  return rows;
}

async function search({ status, from, to, limit = 50, offset = 0 } = {}) {
  const { Logs, Orders } = getModels();

  const where = {};
  if (status) where.status_to = status;

  const range = buildTimestampRange(from, to);
  if (range) where.timestamp_transition = range;

  const rows = await Logs.findAll({
    where,
    include: [
      { model: Orders, as: 'order', required: false },
    ],
    order: [['timestamp_transition', 'DESC']],
    limit,
    offset,
  });

  return rows;
}

async function listByType(type, { limit = 50, offset = 0 } = {}) {
  const { Logs, Orders } = getModels();
  const rows = await Logs.findAll({
    where: { logs_type: type },
    include: [
      { model: Orders, as: 'order', required: false },
    ],
    order: [['timestamp_transition', 'DESC']],
    limit,
    offset,
  });
  return rows;
}

async function listOrders({ limit = 50, offset = 0 } = {}) {
  return listByType('orders', { limit, offset });
}

async function listZones({ limit = 50, offset = 0 } = {}) {
  return listByType('zones', { limit, offset });
}

async function listThresholds({ limit = 50, offset = 0 } = {}) {
  return listByType('thresholds', { limit, offset });
}

export default {
  list,
  getById,
  listByOrder,
  search,
  listOrders,
  listZones,
  listThresholds,
};
