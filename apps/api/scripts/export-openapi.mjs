// Genera docs/contracts/openapi.json a partir de la fuente TypeScript.
// Uso: pnpm --filter api build && pnpm --filter api openapi:export
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openApiDocument } from '../dist/openapi.js';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '../../../docs/contracts/openapi.json');

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(openApiDocument, null, 2)}\n`, 'utf8');
console.log(`OpenAPI exportado en ${output}`);
