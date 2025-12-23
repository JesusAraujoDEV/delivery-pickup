import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000/api/dp/v1';

test('thresholds - create, list and get by id (integration)', async (t) => {
  // POST create
  const payload = { metric_affected: 'itest_metric', value_critical: 7, is_active: true };
  const postRes = await fetch(`${BASE}/thresholds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  assert.equal(postRes.status, 201, 'POST should return 201');
  const created = await postRes.json();
  assert.ok(created.threshold_id, 'created object must have threshold_id');
  assert.equal(created.metric_affected, payload.metric_affected);

  // GET list
  const listRes = await fetch(`${BASE}/thresholds`);
  assert.equal(listRes.status, 200, 'GET list should return 200');
  const list = await listRes.json();
  assert.ok(Array.isArray(list), 'list should be array');
  const found = list.find((x) => x.threshold_id === created.threshold_id);
  assert.ok(found, 'created threshold must appear in list');

  // GET by id
  const getRes = await fetch(`${BASE}/thresholds/${created.threshold_id}`);
  assert.equal(getRes.status, 200, 'GET by id should return 200');
  const got = await getRes.json();
  assert.equal(got.threshold_id, created.threshold_id);
  assert.equal(got.metric_affected, payload.metric_affected);
});
