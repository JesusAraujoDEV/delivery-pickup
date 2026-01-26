import { fetchKitchenProducts } from './kitchen.service.js';

// Kitchen Catalog cache
let lastCache = null;
let lastFetchedAt = 0;
const TTL_MS = 60_000; // 1 minute

function mapKitchenProductToCatalogItem(p) {
  return {
    product_id: String(p.id),
    imageUrl: p.imageUrl || null,
    name: p.name ?? null,
    price: p.basePrice ?? null,
    available: Boolean(p.isActive),
  };
}

async function getCatalog() {
  const now = Date.now();
  if (lastCache && now - lastFetchedAt < TTL_MS) return lastCache;
  const products = await fetchKitchenProducts();
  const data = {
    items: products.map(mapKitchenProductToCatalogItem),
  };
  lastCache = data;
  lastFetchedAt = now;
  return data;
}

export default { getCatalog };
