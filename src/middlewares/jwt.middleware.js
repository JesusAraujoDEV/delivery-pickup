import crypto from 'crypto';
import env from '../config/config.js';

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== 'string') return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1] : null;
}

function base64UrlDecodeToBuffer(str) {
  const pad = str.length % 4;
  const base64 = (str + (pad ? '='.repeat(4 - pad) : '')).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

function base64UrlEncode(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function safeJsonParse(buf) {
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return null;
  }
}

function verifyHs256JwtAndDecode(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return { ok: false, reason: 'INVALID_FORMAT' };

  const [h64, p64, s64] = parts;
  const header = safeJsonParse(base64UrlDecodeToBuffer(h64));
  if (!header || header.alg !== 'HS256') return { ok: false, reason: 'UNSUPPORTED_ALG', header };

  const data = `${h64}.${p64}`;
  const expected = crypto.createHmac('sha256', String(secret)).update(data).digest();
  const expected64 = base64UrlEncode(expected);

  // constant-time compare
  const a = Buffer.from(expected64);
  const b = Buffer.from(String(s64));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'BAD_SIGNATURE' };
  }

  const payload = safeJsonParse(base64UrlDecodeToBuffer(p64));
  if (!payload) return { ok: false, reason: 'INVALID_PAYLOAD' };

  // Optional exp check (seconds)
  if (typeof payload.exp === 'number') {
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) return { ok: false, reason: 'TOKEN_EXPIRED', payload };
  }

  return { ok: true, payload };
}

function buildUserDisplay(payload) {
  const name = payload?.name;
  const email = payload?.email;
  if (name && email) return `${name} - ${email}`;
  if (email) return String(email);
  return null;
}

export function decodeJwtAlways(req, _res, next) {
  const token = getBearerToken(req);
  req.auth = null;
  req.auth_display = null;

  if (!token) return next();

  const secret = env.secretKey;
  const result = verifyHs256JwtAndDecode(token, secret);

  if (result.ok) {
    req.auth = result.payload;
    req.auth_display = buildUserDisplay(result.payload);

    // Log only if explicitly enabled (payload includes PII)
    if (env.logJwtPayload) {
      console.log('[JWT]', {
        path: req.originalUrl,
        method: req.method,
        user: req.auth_display,
        payload: result.payload,
      });
    }

    return next();
  }

  // Don't block requests; just attach metadata.
  if (env.logJwtPayload) {
    console.warn('[JWT] invalid token', {
      path: req.originalUrl,
      method: req.method,
      reason: result.reason,
    });
  }

  return next();
}
