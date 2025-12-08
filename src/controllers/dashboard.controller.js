import ordersService from '../services/orders.service.js';

async function listOrdersByStatus(req, res, next) {
  try {
    const data = await ordersService.listOrdersByStatus();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export default { listOrdersByStatus };
