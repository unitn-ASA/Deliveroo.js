import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import commonjs from 'vite-plugin-commonjs'

// https://vitejs.dev/config/
// https://vite.dev/guide/dep-pre-bundling#monorepos-and-linked-dependencies
export default defineConfig({
  optimizeDeps: {
    include: ['@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs'],
  },
  build: {
    commonjsOptions: {
      include: ["@unitn-asa/deliveroo-js-client/types/ioTypedSocket.cjs"],
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
  }
})
