import { env } from '../config/config.js';

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

function base64UrlDecode(str) {
  const pad = str.length % 4;
  const base64 = (str + (pad ? '='.repeat(4 - pad) : '')).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf8');
}

function decodeJwtPayload(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

const SECURITY_BASE_URL = process.env.SECURITY_BASE_URL || 'https://charlotte-seguridad.onrender.com/api/seguridad';

async function fetchHasPermission(token, resource, method) {
  const url = `${SECURITY_BASE_URL}/auth/hasPermission`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({ resource, method }),
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Security service error (${res.status}): ${text || res.statusText}`);
    err.statusCode = 502;
    throw err;
  }

  const json = await res.json();
  if (!json || typeof json.hasPermission !== 'boolean') {
    const err = new Error('Security service response invalid');
    err.statusCode = 502;
    err.details = json;
    throw err;
  }
  return json.hasPermission;
}

// Cache simple en memoria para no pedir hasPermission en cada request
const permCache = new Map();
function cacheKey(token, resource, method) {
  // Token can be long; we only cache by last 16 chars to reduce memory, plus resource/method.
  const tail = String(token).slice(-16);
  return `${tail}:${resource}:${method}`;
}

/**
 * authorize(resource, method)
 * - Extrae Authorization Bearer <token>
 * - Decodifica el payload y extrae roles (array)
 * - Consulta módulo seguridad: POST /api/seguridad/auth/rol {roles}
 * - Verifica permiso Resource+Method (o Method=All)
 */
export function authorize(resource, method) {
  return async (req, res, next) => {
    try {
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: 'Missing Authorization Bearer token' });

      const payload = decodeJwtPayload(token);
      const isAdmin = payload?.isAdmin;

      if (isAdmin === true) return next();

      const key = cacheKey(token, resource, method);
      const now = Date.now();
      const cached = permCache.get(key);
      if (cached && cached.expiresAt > now) {
        if (cached.allowed !== true) {
          return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
      }

      const allowed = await fetchHasPermission(token, resource, method);
      permCache.set(key, { allowed, expiresAt: now + 30_000 }); // 30s

      if (!allowed) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      return next();
    } catch (err) {
      if (err?.statusCode === 401) return res.status(401).json({ message: 'Unauthorized' });
      if (err?.statusCode === 502) return res.status(502).json({ message: err.message });
      return next(err);
    }
  };
}
