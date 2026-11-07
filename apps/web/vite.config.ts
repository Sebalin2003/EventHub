import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Las specs de Playwright viven en e2e/ y se ejecutan con `test:e2e`, no con Vitest.
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  },
  server: {
    proxy: {
      '/api': {
        // Docker Compose sets API_PROXY_TARGET=http://api:3000.
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
