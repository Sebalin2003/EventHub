import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 4200);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (url.pathname === '/search') {
    const q = (url.searchParams.get('q') ?? '').trim();
    const delayMs = Number(url.searchParams.get('delay') ?? (q.toLowerCase().includes('timeout') ? 5000 : 0));

    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (!q) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify([
        {
          lat: '-34.603722',
          lon: '-58.381592',
          display_name: `${q}, Argentina`,
        },
      ]),
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`EventHub Geocode Mock listening on http://0.0.0.0:${PORT}/search`);
});
