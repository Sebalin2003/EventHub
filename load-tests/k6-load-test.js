import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga (Eje C: 50 usuarios concurrentes, 5 minutos)
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up a 50 usuarios concurrentes
    { duration: '4m', target: 50 },  // Meseta de 50 usuarios concurrentes
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    // Criterio de aceptación Eje C: p95 < 500 ms y tasa de error < 1%
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-testing-agent',
    },
  };

  // 1. Endpoint Crítico 1: Listado y catálogo de eventos
  const resCatalog = http.get(`${BASE_URL}/events`, params);
  check(resCatalog, {
    'GET /events status es 200': (r) => r.status === 200,
    'GET /events latencia < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5);

  // 2. Endpoint Crítico 2: Consulta de detalle de evento por ID
  const eventId = 'd290f1ee-6c54-4b01-90e6-d701748f0851'; // Evento de catálogo
  const resDetail = http.get(`${BASE_URL}/events/${eventId}`, params);
  check(resDetail, {
    'GET /events/:id status es 200 o 404': (r) => r.status === 200 || r.status === 404,
    'GET /events/:id latencia < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.5);

  // 3. Endpoint Crítico 3: Disponibilidad de inventario
  const resInventory = http.get(`${BASE_URL}/inventory/${eventId}`, params);
  check(resInventory, {
    'GET /inventory/:id status es 200 o 404': (r) => r.status === 200 || r.status === 404,
    'GET /inventory/:id latencia < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
