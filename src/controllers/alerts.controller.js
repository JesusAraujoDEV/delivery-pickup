import * as alertsService from '../services/alerts.service.js';

export async function listAlerts(req, res) {
  try {
    const data = await alertsService.getAlerts();
    res.json(data);
  } catch (err) {
    console.error('alerts.list error', err);
    res.status(500).json({ message: 'Internal error' });
  }
}

export default { listAlerts };
