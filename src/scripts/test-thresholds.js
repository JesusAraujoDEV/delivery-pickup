// Simple test script using built-in fetch (Node 18+)
const urlBase = process.env.BASE_URL || 'http://127.0.0.1:3000/api/dp/v1';

async function run() {
  try {
    const payload = { metric_affected: 'test_metric', value_critical: 42, is_active: true };
    console.log('POST', `${urlBase}/thresholds`, payload);
    const postRes = await fetch(`${urlBase}/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const postBody = await postRes.text();
    console.log('POST status', postRes.status);
    console.log('POST body', postBody);

    console.log('\nGET list', `${urlBase}/thresholds`);
    const listRes = await fetch(`${urlBase}/thresholds`);
    const listBody = await listRes.text();
    console.log('GET status', listRes.status);
    console.log('GET body', listBody);
  } catch (err) {
    console.error('Test script error', err);
    process.exit(1);
  }
}

run();
