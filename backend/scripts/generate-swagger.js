#!/usr/bin/env node

import fs from 'fs';
import { swaggerSpec } from '../swagger.config.js';

// Write the swagger spec to a JSON file
fs.writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));

console.log('OpenAPI spec generated successfully: swagger.json');
console.log('View the documentation at: http://localhost:8080/api-docs');
