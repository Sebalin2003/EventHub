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
      include: ['src/**'],
      reporter: ['text', 'json-summary', 'html', 'clover', 'lcov'],
      exclude: [
        '**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**',
        'test/**', 'scripts/**', '**/*.spec.ts',
        // Infraestructura NestJS sin logica de negocio (cubierta por E2E):
        '**/*.module.ts',       // wiring de DI
        '**/*.controller.ts',   // delegacion a servicios, testeada via E2E/Newman
        '**/*.dto.ts',          // decoradores de validacion
        '**/entities/**',       // definiciones de entidades TypeORM (decoradores)
        'src/main.ts',          // bootstrap
        'src/openapi.ts',       // generacion de spec
        'src/openapi.controller.ts',
        '**/event.seed.ts',     // datos de siembra
        '**/security-headers.middleware.ts', // middleware Express puro
      ],
      // Eje B: umbrales minimos de la catedra sobre la capa de negocio.
      thresholds: {
        lines: 80,
        branches: 70,
      },
    },
  },
});
