import { getModels } from '../models/index.js';
import { stringify } from 'csv-stringify';

async function exportCsv() {
  const { Orders } = getModels();
  const orders = await Orders.findAll();
  const rows = orders.map(n => ({
    readable_id: n.readable_id,
    service_type: n.service_type,
    status: n.current_status,
    monto_total: n.monto_total,
    shipping: n.monto_costo_envio,
    created_at: n.timestamp_creation,
    closed_at: n.timestamp_closure,
  }));

  const stream = stringify(rows, { header: true });
  const filename = `dp_report_${new Date().toISOString().slice(0,10)}.csv`;
  return { stream, filename };
}

export default { exportCsv };
