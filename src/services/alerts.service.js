import { getModels } from '../models/index.js';
import * as thresholdsService from './thresholds.service.js';

function minutesBetween(a, b = new Date()) {
  const diff = Math.max(0, new Date(b) - new Date(a));
  return Math.floor(diff / 60000);
}

export async function getAlerts() {
  const { Orders } = getModels();
  const alerts = [];
  const now = new Date();

  // Load relevant thresholds
  const tPending = await thresholdsService.getByMetric('TIEMPO_MAXIMO_ESPERA_PENDIENTE');
  const tKitchen = await thresholdsService.getByMetric('TIEMPO_MAXIMO_COCINA_MINUTOS');
  const tPickupWait = await thresholdsService.getByMetric('TIEMPO_MAXIMO_ESPERA_PICKUP');
  const tTravel = await thresholdsService.getByMetric('TIEMPO_MAXIMO_VIAJE_DELIVERY');

  // PENDING_REVIEW alerts
  if (tPending && tPending.is_active) {
    const rows = await Orders.findAll({ where: { current_status: 'PENDING_REVIEW' } });
    for (const o of rows) {
      const mins = minutesBetween(o.timestamp_creation, now);
      if (mins > Number(tPending.value_critical)) {
        alerts.push({ order_id: o.order_id, readable_id: o.readable_id, metric: tPending.metric_affected, minutes: mins, threshold: tPending.value_critical, status: o.current_status });
      }
    }
  }

  // IN_KITCHEN alerts
  if (tKitchen && tKitchen.is_active) {
    const rows = await Orders.findAll({ where: { current_status: 'IN_KITCHEN' } });
    for (const o of rows) {
      const mins = minutesBetween(o.timestamp_approved, now);
      if (mins > Number(tKitchen.value_critical)) {
        alerts.push({ order_id: o.order_id, readable_id: o.readable_id, metric: tKitchen.metric_affected, minutes: mins, threshold: tKitchen.value_critical, status: o.current_status });
      }
    }
  }

  // READY_FOR_DISPATCH pickup wait alerts
  if (tPickupWait && tPickupWait.is_active) {
    const rows = await Orders.findAll({ where: { current_status: 'READY_FOR_DISPATCH', service_type: 'PICKUP' } });
    for (const o of rows) {
      const mins = minutesBetween(o.timestamp_ready, now);
      if (mins > Number(tPickupWait.value_critical)) {
        alerts.push({ order_id: o.order_id, readable_id: o.readable_id, metric: tPickupWait.metric_affected, minutes: mins, threshold: tPickupWait.value_critical, status: o.current_status });
      }
    }
  }

  // EN_ROUTE travel time alerts
  if (tTravel && tTravel.is_active) {
    const rows = await Orders.findAll({ where: { current_status: 'EN_ROUTE', service_type: 'DELIVERY' } });
    for (const o of rows) {
      const mins = minutesBetween(o.timestamp_dispatched, now);
      if (mins > Number(tTravel.value_critical)) {
        alerts.push({ order_id: o.order_id, readable_id: o.readable_id, metric: tTravel.metric_affected, minutes: mins, threshold: tTravel.value_critical, status: o.current_status });
      }
    }
  }

  return alerts;
}

export default { getAlerts };
