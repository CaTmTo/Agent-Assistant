import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    copyPublicDir: false,
    outDir: path.resolve(__dirname, '../src/main/resources/static'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/framer-motion')) return 'motion'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8082', changeOrigin: true },
    },
  },
})
