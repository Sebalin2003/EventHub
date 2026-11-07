import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Las specs de Playwright viven en e2e/ y se ejecutan con `test:e2e`, no con Vitest.
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  },
})
