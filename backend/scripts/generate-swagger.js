#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { swaggerSpec } from '../swagger.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../swagger.json');

// Write the swagger spec to a JSON file, served at /api-docs by src/app.js
fs.writeFileSync(outPath, JSON.stringify(swaggerSpec, null, 2));

console.log('OpenAPI spec generated successfully: swagger.json');
console.log('View the documentation at: http://localhost:8080/api-docs');
