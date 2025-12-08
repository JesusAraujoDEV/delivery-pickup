import catalogService from '../services/catalog.service.js';

export async function getCatalog(req, res, next) {
  try {
    const data = await catalogService.getCatalog();
    res.json({ source: 'simulated-kitchen', data });
  } catch (err) {
    next(err);
  }
}

export default { getCatalog };
