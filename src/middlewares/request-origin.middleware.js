export function requestOriginLogger(req, res, next) {
  try {
    const origin = req.get('Origin') || req.get('Referer') || req.get('origin') || 'unknown';
    const path = (req.originalUrl || req.url || '').replace(/^\/+/, '');
    console.log(`Ejecutando endpoint ${req.method} ${path} desde ${origin}`);
  } catch (e) {
    // Non-fatal — never break request flow for logging errors
    console.error('requestOriginLogger error', e?.message || e);
  }
  next();
}

export default requestOriginLogger;
