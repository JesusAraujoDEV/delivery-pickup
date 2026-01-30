import { randomUUID } from 'crypto';
import getModels from '../models/index.js';

function isUuidV4(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractResourceFromPath(pathname) {
  const clean = String(pathname || '').replace(/^\/api\/dp\/v1\/?/, '');
  const first = clean.split('/').filter(Boolean)[0];
  return first || 'root';
}

function shouldSkipAudit(req) {
  const method = String(req.method || '').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

  const pathname = String(req.originalUrl || '').split('?')[0];
  if (!pathname.startsWith('/api/dp/v1')) return true;

  // Avoid logging swagger, health, and login bodies.
  if (pathname === '/health') return true;
  if (pathname.startsWith('/docs')) return true;

  return false;
}

export function auditNonGetActions(req, res, next) {
  if (shouldSkipAudit(req)) return next();

  const startedAt = Date.now();
  const pathname = String(req.originalUrl || '').split('?')[0];
  const resource = extractResourceFromPath(pathname);

  res.on('finish', async () => {
    try {
      // If a downstream controller/service decided to create an atomic business log,
      // they can set `req.skip_audit = true` to avoid the generic ACTION log.
      if (req.skip_audit) return;

      // Heuristic: skip generic ACTION logs for endpoints that will create an
      // atomic business transition log (status change / cancel) to avoid duplicates.
      // Matches: /api/dp/v1/orders/:id/status and /api/dp/v1/orders/:id/cancel
      try {
        const lowPath = String(pathname || '').toLowerCase();
        if (/^\/api\/dp\/v1\/orders\/[^\/]+\/(status|cancel)$/.test(lowPath)) return;
      } catch (_) {}
      const { Logs } = getModels();
      if (!Logs) return;

      // If this is an Orders request and has a UUID param, associate to order_id for easy grouping.
      const candidateOrderId = req.params?.order_id || req.params?.id;
      const order_id = isUuidV4(candidateOrderId) ? candidateOrderId : null;

      await Logs.create({
        log_id: randomUUID(),
        order_id,
        manager_display: req.auth_display || null,
        http_method: String(req.method || '').toUpperCase(),
        path: pathname,
        resource,
        logs_type: resource === 'orders' || resource === 'zones' || resource === 'thresholds' ? resource : null,
        status_from: null,
        status_to: 'ACTION',
        cancellation_reason: null,
      });

      // Optional debug log
      if (process.env.LOG_AUDIT_ACTIONS === '1' || process.env.LOG_AUDIT_ACTIONS === 'true') {
        const ms = Date.now() - startedAt;
        console.log('[AUDIT]', `${req.method} ${pathname}`, { status: res.statusCode, ms, manager: req.auth_display || null });
      }
    } catch (e) {
      // Never break the request if logging fails.
      console.warn('[AUDIT] Failed to write log:', e?.message || e);
    }
  });

  return next();
}
