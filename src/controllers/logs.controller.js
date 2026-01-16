import logsService from '../services/logs.service.js';

// GET /api/dp/v1/logs
async function list(req, res, next) {
  try {
    const { limit, offset } = req.query || {};
    const data = await logsService.list({ limit, offset });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/dp/v1/logs/:log_id
async function get(req, res, next) {
  try {
    const { log_id } = req.params;
    const data = await logsService.getById(log_id);
    if (!data) return res.status(404).json({ message: 'Log not found' });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/dp/v1/logs/by-order/:order_id
async function listByOrder(req, res, next) {
  try {
    const { order_id } = req.params;
    const { limit, offset } = req.query || {};
    const data = await logsService.listByOrder(order_id, { limit, offset });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// GET /api/dp/v1/logs/search
async function search(req, res, next) {
  try {
    const { status, manager_id, from, to, limit, offset } = req.query || {};
    const data = await logsService.search({ status, manager_id, from, to, limit, offset });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export default {
  list,
  get,
  listByOrder,
  search,
};
