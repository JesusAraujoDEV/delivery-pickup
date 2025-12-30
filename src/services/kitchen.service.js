const KITCHEN_BASE_URL = process.env.KITCHEN_BASE_URL || 'https://charlotte-cocina.onrender.com/api/kitchen';

/**
 * Crea una orden en Cocina.
 *
 * Nota: no tenemos el contrato oficial completo aquí, así que implementamos una versión
 * flexible que envía el payload y valida la respuesta de forma defensiva.
 *
 * Payload sugerido por negocio:
 * {
 *  externalOrderId: string,
 *  sourceModule: string,
 *  serviceMode: string,
 *  displayLabel: string,
 *  customerName?: string,
 *  items: Array<{ productId: string, quantity: number, notes?: string }>
 * }
 */
export async function createKitchenOrder(payload) {
  // API real de Cocina para inyectar órdenes al KDS
  const url = `${KITCHEN_BASE_URL}/kds/inject`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Kitchen API error (${res.status}): ${text || res.statusText}`);
    err.statusCode = 502;
    throw err;
  }

  const json = await res.json().catch(() => null);
  // Aceptamos varias formas, pero al menos debe ser un objeto.
  if (!json || typeof json !== 'object') {
    const err = new Error('Kitchen API response invalid');
    err.statusCode = 502;
    err.details = json;
    throw err;
  }

  return json;
}

/**
 * Obtiene el catálogo de productos activos/inactivos desde cocina.
 * Response esperado:
 * { success: boolean, message: string, data: Array<{id,name,isActive,basePrice,...}> }
 */
export async function fetchKitchenProducts() {
  const url = `${KITCHEN_BASE_URL}/products`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Kitchen API error (${res.status}): ${text || res.statusText}`);
    err.statusCode = 502;
    throw err;
  }

  const json = await res.json();
  if (!json || json.success !== true || !Array.isArray(json.data)) {
    const err = new Error('Kitchen API response invalid');
    err.statusCode = 502;
    err.details = json;
    throw err;
  }

  return json.data;
}

/**
 * Valida que los items de una orden existan como productos en cocina.
 * Reglas:
 * - item.product_id debe existir en products[].id
 * - el producto debe estar isActive=true
 * - fallback opcional por nombre (si se quiere), pero por defecto solo id
 */
export function validateOrderItemsAgainstKitchenProducts(items, products, { fallbackByName = false } = {}) {
  const byId = new Map(products.map((p) => [String(p.id), p]));
  const byName = new Map(products.map((p) => [String(p.name || '').trim().toLowerCase(), p]));

  const invalid = [];

  for (const it of items || []) {
    const pid = String(it.product_id);
    let p = byId.get(pid);

    if (!p && fallbackByName) {
      const key = String(it.product_name || '').trim().toLowerCase();
      p = byName.get(key);
    }

    if (!p) {
      invalid.push({ product_id: it.product_id, product_name: it.product_name, reason: 'NOT_FOUND' });
      continue;
    }

    if (!p.isActive) {
      invalid.push({ product_id: it.product_id, product_name: it.product_name, reason: 'INACTIVE' });
      continue;
    }
  }

  return { ok: invalid.length === 0, invalid };
}
