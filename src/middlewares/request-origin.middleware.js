export function requestOriginLogger(req, res, next) {
  try {
    // 0. FILTRO DE RUIDO: Si es un archivo estático, pasamos sin loguear
    // Ignoramos: css, js, imágenes, fuentes y sourcemaps
    if (req.url.match(/\.(css|js|ico|png|jpg|jpeg|woff|woff2|svg|map)$/)) {
      next();
      return; // Importante: salir de la función aquí
    }

    // 1. Buscamos el origen web (Frontend)
    const origin = req.get('Origin') || req.get('Referer') || 'unknown';
    
    // 2. Buscamos la IP REAL (Incluso detrás de proxies como Dokploy/Nginx)
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