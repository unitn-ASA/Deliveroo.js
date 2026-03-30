#!/usr/bin/env node

/**
 * Generate OpenAPI schemas from JSDoc type definitions in the SDK
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkTypesPath = path.join(__dirname, '../../packages/@unitn-asa/deliveroo-js-sdk/src/types');

/**
 * Parse JSDoc type definition and convert to OpenAPI schema
 * @param {string} content - File content
 * @param {string} typeName - Name of the type to extract
 * @returns {object} OpenAPI schema
 */
function parseJSDocType(content, typeName) {
  // Match the @typedef block
  const typedefRegex = new RegExp(`/\\*\\*[\\s\\S]*?@typedef\\s+${typeName}[\\s\\S]*?\\*/[\\s\\S]*?export`, 'i');
  const match = content.match(typedefRegex);

  if (!match) {
    // Try without the export keyword
    const altRegex = new RegExp(`/\\*\\*[\\s\\S]*?@typedef\\s+${typeName}[\\s\\S]*?\\*/`, 'i');
    const altMatch = content.match(altRegex);
    if (!altMatch) return null;
  }

  const commentBlock = match ? match[0] : (content.match(new RegExp(`@typedef\\s+${typeName}[\\s\\S]*?\\*/`, 'i'))?.[0]);

  if (!commentBlock) return null;

  const properties = {};

  // Extract @property lines
  const propertyRegex = /@property\s+\{([^}]+)\}\s+(\w+)/g;
  let propMatch;

  while ((propMatch = propertyRegex.exec(commentBlock)) !== null) {
    const [, type, name] = propMatch;

    // Convert JSDoc type to OpenAPI type
    let openapiType = 'string';

    if (type === 'number') {
      openapiType = 'number';
    } else if (type === 'boolean') {
      openapiType = 'boolean';
    } else if (type === 'string') {
      openapiType = 'string';
    } else if (type.startsWith('Array<')) {
      openapiType = 'array';
      // Handle array types
    }

    const propertyDef = { type: openapiType };
    properties[name] = propertyDef;
  }

  return {
    type: 'object',
    properties
  };
}

/**
 * Main schema generation
 */
function generateSchemas() {
  const schemas = {};

  // Define types to extract
  const typesToExtract = [
    { file: 'IOAgent.js', name: 'IOAgent', schemaName: 'Agent' },
    { file: 'IOParcel.js', name: 'IOParcel', schemaName: 'Parcel' },
    { file: 'IOConfig.js', name: 'IOConfig', schemaName: 'Configs' },
    { file: 'IOTile.js', name: 'IOTile', schemaName: 'Tile' },
    { file: 'IONPC.js', name: 'IONPC', schemaName: 'NPC' },
  ];

  for (const { file, name, schemaName } of typesToExtract) {
    const filePath = path.join(sdkTypesPath, file);

    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${file} not found at ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const schema = parseJSDocType(content, name);

    if (schema) {
      schemas[schemaName] = schema;
      console.log(`✓ Generated schema for ${schemaName} from ${name}`);
    } else {
      console.warn(`Warning: Could not parse ${name} from ${file}`);
    }
  }

  return schemas;
}

// Generate and export schemas
const schemas = generateSchemas();

// Output the schemas as a module that can be imported
const output = `
/**
 * Auto-generated OpenAPI schemas from SDK JSDoc types
 * Run 'npm run schemas:generate' to regenerate
 */
export const generatedSchemas = ${JSON.stringify(schemas, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/generated-schemas.js'), output);
console.log('\n✓ Schemas written to src/generated-schemas.js');
