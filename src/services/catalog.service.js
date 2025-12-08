// Simulated Kitchen API catalog
let lastCache = null;
let lastFetchedAt = 0;
const TTL_MS = 60_000; // 1 minute

const simulatedCatalog = [
  {
    id: 'K-100',
    name: 'Hamburguesa Clásica',
    description: 'Carne 120g, queso, lechuga, tomate',
    price: 5.99,
    available: true,
  },
  {
    id: 'K-200',
    name: 'Perro Caliente',
    description: 'Salchicha, salsas, papitas',
    price: 3.49,
    available: true,
  },
  {
    id: 'K-300',
    name: 'Papas Fritas',
    description: 'Porción mediana',
    price: 2.49,
    available: true,
  }
];

async function fetchSimulatedKitchenCatalog() {
  // emulate delay
  await new Promise((r) => setTimeout(r, 50));
  return simulatedCatalog;
}

async function getCatalog() {
  const now = Date.now();
  if (lastCache && now - lastFetchedAt < TTL_MS) return lastCache;
  const data = await fetchSimulatedKitchenCatalog();
  lastCache = data;
  lastFetchedAt = now;
  return data;
}

export default { getCatalog };
