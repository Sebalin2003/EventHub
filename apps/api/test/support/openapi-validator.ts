import Ajv2020 from 'ajv/dist/2020.js';
import { openApiDocument } from '../../src/openapi.js';

/**
 * Validador de contrato (Eje B): valida payloads reales contra los schemas
 * publicados en el OpenAPI de EventHub.
 *
 * Se usa Ajv en modo 2020-12 porque OpenAPI 3.1 adopta JSON Schema 2020-12.
 * Los formatos se registran a mano para no depender de plugins adicionales.
 */
const ajv = new Ajv2020({ allErrors: true, strict: false });

ajv.addFormat('date-time', {
  type: 'string',
  validate: (value: string) => !Number.isNaN(Date.parse(value)),
});
ajv.addFormat('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);

export const OPENAPI_SCHEMA_ID = 'https://eventhub.test/openapi.json';

ajv.addSchema({ ...(openApiDocument as unknown as Record<string, unknown>), $id: OPENAPI_SCHEMA_ID });

export type OpenApiComponent =
  | 'ProblemDetails'
  | 'RegisterRequest'
  | 'LoginRequest'
  | 'User'
  | 'AuthResponse'
  | 'TicketType'
  | 'Event'
  | 'CreateEventRequest'
  | 'UpdateEventRequest'
  | 'InventoryStatus'
  | 'SetInventoryRequest'
  | 'CreateHoldRequest'
  | 'Hold'
  | 'OrderItem'
  | 'Order'
  | 'CreateOrderRequest'
  | 'PayOrderRequest'
  | 'PaymentRequest'
  | 'PaymentDto'
  | 'PaymentResult'
  | 'PaymentApproval'
  | 'CircuitBreakerStatus'
  | 'EmitTicketsRequest'
  | 'Ticket'
  | 'ScanRequest'
  | 'ScanResult'
  | 'Favorite'
  | 'AiAdvisorRequest'
  | 'AiAdvisorResponse';

export function validateContract(name: OpenApiComponent, data: unknown): void {
  const validate = ajv.getSchema(`${OPENAPI_SCHEMA_ID}#/components/schemas/${name}`);
  if (!validate) {
    throw new Error(`No se encontro el schema OpenAPI "${name}"`);
  }
  if (!validate(data)) {
    throw new Error(`Contrato OpenAPI invalido para "${name}": ${ajv.errorsText(validate.errors)}`);
  }
}

export function contractErrors(name: OpenApiComponent, data: unknown): string | null {
  const validate = ajv.getSchema(`${OPENAPI_SCHEMA_ID}#/components/schemas/${name}`);
  if (!validate) return `schema ${name} inexistente`;
  return validate(data) ? null : ajv.errorsText(validate.errors);
}
