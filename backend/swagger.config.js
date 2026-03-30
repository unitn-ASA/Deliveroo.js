import swaggerJsdoc from 'swagger-jsdoc';
import { generatedSchemas } from './src/generated-schemas.js';

const options = {
  definition: {
    openapi: '3.0.4',
    info: {
      version: '1.0.0',
      title: 'Deliveroo.js API',
      description: `Deliveroo.js is a simple grid-based multi-player game
        where players can move around, collect items, and interact with each other.`,
      license: {
        name: 'MIT',
      },
      contact: {
        name: 'Marco Robol',
        email: 'marco.robol@unitn.it',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Same as the current URL',
      },
      {
        url: 'http://localhost:8080/',
        description: 'Localhost',
      },
      {
        url: 'https://deliveroojs.rtibdi.disi.unitn.it/',
        description: 'Unitn',
      },
      {
        url: 'https://deliveroojs25.azurewebsites.net/',
        description: 'Azure',
      },
    ],
    components: {
      securitySchemes: {
        AdminHeaderToken: {
          description: "A valid JWT token must be passed in the header 'x-token'.",
          type: 'apiKey',
          in: 'header',
          name: 'x-token',
        },
        AdminQueryToken: {
          description: "A valid JWT token must be passed in the query 'token'.",
          type: 'apiKey',
          in: 'query',
          name: 'token',
        },
      },
      schemas: {
        ...generatedSchemas
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
