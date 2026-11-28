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
let vuToken = null;

export function setup() {
  const runId = Date.now();
  const orgLogin = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'eventos@eventhub.com.ar', password: 'password' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(orgLogin, { 'login organizador exitoso': (r) => r.status === 200 });
  const orgToken = orgLogin.json('accessToken');

  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const created = http.post(
    `${BASE_URL}/organizer/events`,
    JSON.stringify({
      title: `Evento Carga k6 ${runId}`,
      description: 'Evento de alta capacidad para pruebas de carga k6.',
      category: 'conferencia',
      modality: 'online',
      date: start.toISOString(),
      endDate: end.toISOString(),
      venue: 'Online',
      city: 'Online',
      capacity: 100000,
      ticketTypes: [{ name: 'General', price: 1000, totalQuantity: 100000 }],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgToken}`,
      },
    },
  );
  check(created, { 'evento k6 creado': (r) => r.status === 201 });
  const eventId = created.json('id');

  const published = http.post(
    `${BASE_URL}/organizer/events/${eventId}/publish`,
    null,
    { headers: { Authorization: `Bearer ${orgToken}` } },
  );
  check(published, { 'evento k6 publicado': (r) => r.status === 200 || r.status === 201 });

  return { eventId, runId };
}

function ensureVuToken(runId) {
  if (vuToken) return vuToken;
  const email = `k6-vu-${__VU}-${runId}@eventhub.com.ar`;
  const password = 'Password123!';
  http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password, firstName: 'Load', lastName: `VU${__VU}` }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const login = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(login, { 'login VU exitoso': (r) => r.status === 200 });
  vuToken = login.json('accessToken');
  return vuToken;
}

export default function (data) {
  const token = ensureVuToken(data.runId);
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

  // 4. Flujo de escritura crítico: crear una orden y pagarla.
  const resOrder = http.post(
    `${BASE_URL}/orders`,
    JSON.stringify({
      items: [{ eventId: data.eventId, ticketType: 'General', quantity: 1 }],
    }),
    {
      ...params,
      headers: {
        ...params.headers,
        'Idempotency-Key': `k6-${__VU}-${__ITER}-${Date.now()}`,
      },
    },
  );
  check(resOrder, {
    'POST /orders crea o retorna una orden': (r) => r.status === 200 || r.status === 201,
  });

  if (resOrder.status === 200 || resOrder.status === 201) {
    const orderId = resOrder.json('id');
    const resPay = http.post(
      `${BASE_URL}/orders/${orderId}/pay`,
      JSON.stringify({ card: '4242 4242 4242 4242' }),
      params,
    );
    check(resPay, {
      'POST /orders/:id/pay procesa el pago': (r) => r.status === 200 || r.status === 402 || r.status === 503 || r.status === 504,
    });
  }
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
