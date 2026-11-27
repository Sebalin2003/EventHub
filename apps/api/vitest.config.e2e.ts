import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Varias suites levantan la app completa y consumen la misma cola de RabbitMQ.
    // En paralelo, un mensaje podía caer en el consumidor de otra suite y el test
    // de duplicados fallaba de forma intermitente. Se ejecutan de a una.
    fileParallelism: false,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**'],
  },
});
