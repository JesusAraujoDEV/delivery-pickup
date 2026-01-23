import logsService from '../services/logs.service.js';

function withManagerDisplay(req, data) {
  const display = req.auth_display || null;

  if (Array.isArray(data)) {
    return data.map((row) => {
      const plain = row?.toJSON ? row.toJSON() : row;
      // Prefer persisted manager_display (works even when GET is unauthenticated)
      if (plain && plain.manager_display) plain.manager = plain.manager_display;
      // If not present, expose the JWT user as a simple string.
      if (plain && !plain.manager && display) plain.manager = display;
      if (plain && plain.manager_display == null) {
        plain.manager_display = display;
      }
      return plain;
    });
  }

  const plain = data?.toJSON ? data.toJSON() : data;
  if (plain && plain.manager_display) plain.manager = plain.manager_display;
  if (plain && !plain.manager && display) plain.manager = display;
  if (plain && plain.manager_display == null) {
    plain.manager_display = display;
  }
  return plain;
}

// GET /api/dp/v1/logs
async function list(req, res, next) {
  try {
    const { limit, offset } = req.query || {};
    const data = await logsService.list({ limit, offset });
    res.json(withManagerDisplay(req, data));
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
    res.json(withManagerDisplay(req, data));
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
    res.json(withManagerDisplay(req, data));
  } catch (err) {
    next(err);
  }
}

// GET /api/dp/v1/logs/search
async function search(req, res, next) {
  try {
    const { status, from, to, limit, offset } = req.query || {};
    const data = await logsService.search({ status, from, to, limit, offset });
    res.json(withManagerDisplay(req, data));
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
