import http from 'k6/http';
import { check, sleep } from 'k6';

// Eje C: 50 usuarios concurrentes durante 5 minutos sobre 3 endpoints criticos.
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up a 50 usuarios
    { duration: '4m', target: 50 },  // Meseta de 50 usuarios concurrentes
    { duration: '30s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    // Criterio de aceptacion: p95 < 500 ms y tasa de error < 1%
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'maria@eventhub.com.ar', password: 'password' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(login, { 'login inicial exitoso': (r) => r.status === 200 });
  const token = login.json('accessToken');

  const events = http.get(`${BASE_URL}/events`);
  check(events, { 'catalogo disponible en setup': (r) => r.status === 200 });
  const eventId = events.json('0.id') || 'e1';

  return { token, eventId };
}

export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
      'User-Agent': 'k6-load-testing-agent',
    },
  };

  // 1. Endpoint critico: listado y catalogo de eventos
  const resCatalog = http.get(`${BASE_URL}/events`, params);
  check(resCatalog, {
    'GET /events status es 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 2. Endpoint critico: detalle del evento
  const resDetail = http.get(`${BASE_URL}/events/${data.eventId}`, params);
  check(resDetail, {
    'GET /events/:id status es 200': (r) => r.status === 200,
  });

  sleep(0.5);

  // 3. Endpoint critico: disponibilidad de inventario (requiere autenticacion)
  const resInventory = http.get(`${BASE_URL}/inventory/${data.eventId}`, params);
  check(resInventory, {
    'GET /inventory/:id status es 200': (r) => r.status === 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  // El resumen incluye los datos de setup (token JWT): se redactan antes de versionar.
  const safe = JSON.parse(JSON.stringify(data));
  if (safe.setup_data?.token) {
    safe.setup_data.token = '[REDACTED]';
  }

  return {
    'docs/evidencias/k6-summary.json': JSON.stringify(safe, null, 2),
    stdout: `p95=${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2)}ms error_rate=${(
      data.metrics.http_req_failed?.values?.rate * 100
    ).toFixed(2)}%\n`,
  };
}
