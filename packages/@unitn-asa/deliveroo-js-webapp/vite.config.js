import { defineConfig } from 'vite'
import { resolve } from 'path'
// import polyfillNode from 'rollup-plugin-polyfill-node'

export default defineConfig({
//   plugins: [
//     polyfillNode()
//   ],
//   optimizeDeps: {
//     exclude: ['buffer'] // <= The libraries that need shimming should be excluded from dependency optimization.
//   }

    root: resolve(__dirname,'game'),
    build: {
        outDir: '../dist/game',
        emptyOutDir: true,
      },
    base: '/game/',

    
})
