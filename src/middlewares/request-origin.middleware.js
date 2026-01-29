export function requestOriginLogger(req, res, next) {
  try {
    // 1. Buscamos el origen web (Frontend)
    const origin = req.get('Origin') || req.get('Referer') || 'unknown';
    
    // 2. Buscamos la IP REAL (Incluso detrás de proxies como Dokploy/Nginx)
    // 'x-forwarded-for' suele contener la IP real del cliente antes de pasar por el proxy
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    // 3. Buscamos quién es (Navegador, Bot, Postman, Curl)
    const userAgent = req.get('User-Agent') || 'Ghost';

    const path = (req.originalUrl || req.url || '').replace(/^\/+/, '');

    // Log enriquecido
    console.log(`📡 [${req.method}] /${path}`);
    console.log(`   ↳ Desde: ${origin}`);
    console.log(`   ↳ IP: ${ip} | Agente: ${userAgent}`);
    console.log('------------------------------------------------');

  } catch (e) {
    console.error('Logger error', e?.message || e);
  }
  next();
}

export default requestOriginLogger;