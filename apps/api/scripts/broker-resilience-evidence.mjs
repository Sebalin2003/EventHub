#!/usr/bin/env node
/**
 * Eje C - Evidencia reproducible de caida y recuperacion del broker.
 *
 * Requisitos:
 *   - API corriendo (por defecto http://localhost:3000) con el codigo actual.
 *   - PostgreSQL y RabbitMQ levantados con docker compose.
 *
 * El script:
 *   1. detiene el contenedor de RabbitMQ;
 *   2. crea una orden real por HTTP (debe responder 201);
 *   3. verifica que el evento order.created quede PENDING en el outbox;
 *   4. vuelve a levantar RabbitMQ;
 *   5. espera a que el outbox lo marque SENT y a que el consumidor persista
 *      la notificacion, sin intervencion manual.
 *
 * Uso:
 *   node scripts/broker-resilience-evidence.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BROKER_CONTAINER = process.env.BROKER_CONTAINER || 'eventhub_broker';
const POLL_TIMEOUT_MS = Number(process.env.POLL_TIMEOUT_MS || 90000);
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'evidencias');
const OUT_FILE = resolve(OUT_DIR, 'broker-recovery.json');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'evenhub',
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8' }).trim();

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // respuesta no JSON
  }
  return { status: response.status, body };
}

async function waitFor(check, label, timeoutMs = POLL_TIMEOUT_MS) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    last = await check();
    if (last) return last;
    await sleep(500);
  }
  throw new Error(`Timeout esperando ${label} (${timeoutMs}ms)`);
}

async function waitForBrokerUp() {
  await waitFor(
    () => {
      try {
        return docker('inspect', '--format', '{{.State.Health.Status}}', BROKER_CONTAINER) === 'healthy';
      } catch {
        return false;
      }
    },
    'RabbitMQ healthy',
    120000,
  );
}

async function main() {
  const evidence = {
    test: 'Eje C - caida y recuperacion del broker sin perdida de mensajes',
    startedAt: new Date().toISOString(),
    apiUrl: API_URL,
    brokerContainer: BROKER_CONTAINER,
    steps: [],
  };
  const step = (name, data = {}) => {
    evidence.steps.push({ name, at: new Date().toISOString(), ...data });
    console.log(`[OK] ${name}`);
  };

  const health = await api('/events');
  if (health.status !== 200) throw new Error(`La API no responde: ${health.status}`);
  step('API disponible antes de la prueba', { status: health.status });

  const login = await api('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'maria@eventhub.com.ar', password: 'password' }),
  });
  if (login.status !== 200) throw new Error(`Login fallo: ${login.status} ${JSON.stringify(login.body)}`);
  const token = login.body.accessToken;
  step('Login real contra PostgreSQL');

  await waitForBrokerUp();
  docker('stop', BROKER_CONTAINER);
  evidence.brokerStoppedAt = new Date().toISOString();
  step('RabbitMQ detenido', { container: BROKER_CONTAINER });

  const idempotencyKey = `broker-recovery-${Date.now()}`;
  const created = await api('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ items: [{ eventId: 'e1', ticketType: 'tt1a', quantity: 1 }] }),
  });
  if (created.status !== 201) {
    throw new Error(`La orden no se creo con el broker caido: ${created.status} ${JSON.stringify(created.body)}`);
  }
  const orderId = created.body.id;
  evidence.orderId = orderId;
  evidence.httpStatusWithBrokerDown = created.status;
  step('Orden creada con el broker caido', { orderId, httpStatus: created.status });

  const db = new Client(dbConfig);
  await db.connect();

  try {
    const pending = await waitFor(
      async () => {
        const { rows } = await db.query(
          `SELECT id, status, attempts FROM outbox_messages
           WHERE topic = 'order.created' AND payload->>'orderId' = $1`,
          [orderId],
        );
        return rows[0] && rows[0].status === 'PENDING' ? rows[0] : null;
      },
      'evento PENDING en el outbox',
      15000,
    );
    evidence.outboxWhileDown = pending;
    step('El evento queda persistido en el outbox como PENDING', pending);

    const started = Date.now();
    docker('start', BROKER_CONTAINER);
    evidence.brokerStartedAt = new Date().toISOString();
    await waitForBrokerUp();
    step('RabbitMQ levantado y healthy');

    const sent = await waitFor(
      async () => {
        const { rows } = await db.query(
          `SELECT id, status, attempts, "sentAt" FROM outbox_messages WHERE id = $1`,
          [pending.id],
        );
        return rows[0] && rows[0].status === 'SENT' ? rows[0] : null;
      },
      'evento SENT en el outbox',
    );
    evidence.outboxAfterRecovery = sent;
    evidence.recoveryMs = Date.now() - started;
    step('El dispatcher publica el evento solo y lo marca SENT', { recoveryMs: evidence.recoveryMs });

    const notification = await waitFor(
      async () => {
        const { rows } = await db.query(
          `SELECT id, "to", template FROM notifications
           WHERE "to" = $1 AND template = 'order-confirmation'
           ORDER BY "createdAt" DESC LIMIT 1`,
          ['maria@eventhub.com.ar'],
        );
        return rows[0] ?? null;
      },
      'notificacion persistida',
    );
    evidence.notification = notification;
    step('El consumidor proceso el mensaje y persistio la notificacion', notification);

    evidence.result = 'PASS';
    evidence.messageLoss = false;
  } finally {
    await db.end();
  }

  evidence.finishedAt = new Date().toISOString();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(`\nEvidencia guardada en ${OUT_FILE}`);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch(error => {
  console.error(`[FAIL] ${error.message}`);
  process.exitCode = 1;
});
