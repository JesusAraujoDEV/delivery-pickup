const SECURITY_BASE_URL = process.env.SECURITY_BASE_URL || 'https://charlotte-seguridad.onrender.com/api/seguridad';

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function login({ email, password }) {
  const url = `${SECURITY_BASE_URL}/auth/login`;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.SECURITY_TIMEOUT_MS || 10_000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    const rawText = await res.text().catch(() => '');
    const json = rawText ? safeJsonParse(rawText) : null;

    if (!res.ok) {
      // Propaga errores “funcionales” (credenciales inválidas, etc.) tal cual.
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        const err = new Error(json?.message || json?.error || res.statusText || 'Login failed');
        err.statusCode = res.status;
        err.details = json ?? rawText;
        throw err;
      }

      const err = new Error(`Security service error (${res.status})`);
      err.statusCode = 502;
      err.details = json ?? rawText;
      throw err;
    }

    if (!json || typeof json.token !== 'string') {
      const err = new Error('Security service response invalid');
      err.statusCode = 502;
      err.details = json ?? rawText;
      throw err;
    }

    return { token: json.token };
  } catch (e) {
    if (e?.name === 'AbortError') {
      const err = new Error('Security service timeout');
      err.statusCode = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export default {
  login,
};
