import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // El sandbox de Stryker contiene copias de los tests; nunca debe ejecutarse ni medirse.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**', '**/coverage/**'],
    coverage: {
      reporter: ['text', 'json-summary', 'html', 'clover'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**', 'test/**', 'scripts/**', '**/*.spec.ts'],
      // Eje B: umbrales minimos de la catedra sobre la capa de negocio.
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
