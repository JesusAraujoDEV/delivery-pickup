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
  const { Logs, Managers, Orders } = getModels();
  const rows = await Logs.findAll({
    include: [
      { model: Managers, as: 'manager', required: false },
      { model: Orders, as: 'order', required: false },
    ],
    order: [['timestamp_transition', 'DESC']],
    limit,
    offset,
  });
  return rows;
}

async function getById(log_id) {
  const { Logs, Managers, Orders } = getModels();
  const row = await Logs.findByPk(log_id, {
    include: [
      { model: Managers, as: 'manager', required: false },
      { model: Orders, as: 'order', required: false },
    ],
  });
  return row;
}

async function listByOrder(order_id, { limit = 200, offset = 0 } = {}) {
  const { Logs, Managers } = getModels();
  const rows = await Logs.findAll({
    where: { order_id },
    include: [{ model: Managers, as: 'manager', required: false }],
    order: [['timestamp_transition', 'ASC']],
    limit,
    offset,
  });
  return rows;
}

async function search({ status, manager_id, from, to, limit = 50, offset = 0 } = {}) {
  const { Logs, Managers, Orders } = getModels();

  const where = {};
  if (status) where.status_to = status;
  if (manager_id) where.manager_id = manager_id;

  const range = buildTimestampRange(from, to);
  if (range) where.timestamp_transition = range;

  const rows = await Logs.findAll({
    where,
    include: [
      { model: Managers, as: 'manager', required: false },
      { model: Orders, as: 'order', required: false },
    ],
    order: [['timestamp_transition', 'DESC']],
    limit,
    offset,
  });

  return rows;
}

export default {
  list,
  getById,
  listByOrder,
  search,
};
