import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import env from '../config/config.js';

function mergePaths(base, extra) {
  if (!extra) return;
  base.paths = base.paths || {};
  for (const [p, def] of Object.entries(extra)) {
    base.paths[p] = def; // override or add
  }
}

function mergeComponents(base, extra) {
  if (!extra) return;
  base.components = base.components || {};
  for (const [section, defs] of Object.entries(extra)) {
    base.components[section] = base.components[section] || {};
    for (const [name, schema] of Object.entries(defs)) {
      base.components[section][name] = schema; // override or add
    }
  }
}

function mergeTags(base, extra) {
  if (!extra) return;
  const byName = new Map((base.tags || []).map(t => [t.name, t]));
  for (const tag of extra) {
    if (!byName.has(tag.name)) byName.set(tag.name, tag);
  }
  base.tags = Array.from(byName.values());
}

export function mountSwagger(app) {
  const dir = path.join(process.cwd(), 'src', 'swagger');
  const basePath = path.join(dir, 'openapi.yaml');
  const baseYaml = fs.readFileSync(basePath, 'utf8');
  const doc = YAML.parse(baseYaml);
  // Merge any additional *.yaml files in swagger folder (excluding openapi.yaml)
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') && f !== 'openapi.yaml');
  console.log('Swagger: found swagger files to merge:', files);
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      const part = YAML.parse(content);
      if (part.paths) mergePaths(doc, part.paths);
      if (part.components) mergeComponents(doc, part.components);
      if (part.tags) mergeTags(doc, part.tags);
    } catch (e) {
      console.error('Failed to merge Swagger file:', f, e.message);
    }
  }

  // Debug: show merged paths keys
  try {
    console.log('Swagger: merged paths count=', Object.keys(doc.paths || {}).length);
    console.log('Swagger: some paths=', Object.keys(doc.paths || {}).slice(0, 20));
  } catch (e) {
    console.error('Swagger: error logging merged paths', e.message);
  }

  // Override servers from env if provided
  const url = env.backendUrl || `http://localhost:${env.port}`;
  doc.servers = [{ url }];

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(doc));
}
