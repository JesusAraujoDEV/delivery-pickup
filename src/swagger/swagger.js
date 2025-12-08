import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import env from '../config/config.js';

export function mountSwagger(app) {
  const specPath = path.join(process.cwd(), 'src', 'swagger', 'openapi.yaml');
  const file = fs.readFileSync(specPath, 'utf8');
  const swaggerDocument = YAML.parse(file);
  // Override servers from env if provided
  const url = env.backendUrl || `http://localhost:${env.port}`;
  swaggerDocument.servers = [{ url }];
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
