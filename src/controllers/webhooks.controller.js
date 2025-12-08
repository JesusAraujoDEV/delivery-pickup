import ordersService from '../services/orders.service.js';
import Joi from 'joi';

const schema = Joi.object({
  readable_id: Joi.string().required(),
});

async function kitchenReady(req, res, next) {
  try {
    const payload = await schema.validateAsync(req.body);
    const data = await ordersService.webhookKitchenReady(payload.readable_id);
    if (!data) return res.status(404).json({ message: 'Order not found' });
    res.json({ ok: true, data });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ message: 'Validation error', details: err.details });
    next(err);
  }
}

export default { kitchenReady };
