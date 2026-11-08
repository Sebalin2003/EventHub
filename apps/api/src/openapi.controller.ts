import { Controller, Get } from '@nestjs/common';
import { openApiDocument } from './openapi.js';

/**
 * Publica el contrato OpenAPI en `GET /openapi.json` (Eje B: contratos).
 */
@Controller()
export class OpenApiController {
  @Get('openapi.json')
  getDocument() {
    return openApiDocument;
  }
}
