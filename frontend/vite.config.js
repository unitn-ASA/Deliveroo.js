import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from 'vite-plugin-commonjs'
import { execSync } from 'child_process';

/**
 * https://v2.vitejs.dev/config/#define
 * Starting from 2.0.0-beta.70, string values will be used as raw expressions, so if defining a string constant, it needs to be explicitly quoted (e.g. with JSON.stringify).
 */
const commitHash = execSync('git rev-parse HEAD').toString().trim();

// https://vitejs.dev/config/
// https://vite.dev/guide/dep-pre-bundling#monorepos-and-linked-dependencies
export default defineConfig( () => {
  return {
    optimizeDeps: {
      include: [
        '@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs',
        '@unitn-asa/deliveroo-js-client/*',
        '../deliveroo-js-client/types/ioTypedSocket.cjs',
        '../deliveroo-js-client/*'
      ],
    },
    build: {
      commonjsOptions: {
        include: [
          '@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs',
          '../deliveroo-js-client/types/ioTypedSocket.cjs',
          '../deliveroo-js-client/ioClientSocket.js'
        ],
      },
    },
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0', // Ascolta su tutte le interfacce di rete
      // port: 3000, // Puoi specificare la porta che preferisci
    },
    define: {
      '__COMMIT_HASH__': JSON.stringify( commitHash ),
    }
  };
})
