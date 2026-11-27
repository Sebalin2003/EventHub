import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import * as soap from 'soap';

const PORT = Number(process.env.PORT ?? 4100);
const wsdlPath = process.env.WSDL_PATH || new URL('./payments.wsdl', import.meta.url);
const wsdlXml = readFileSync(wsdlPath, 'utf8');

const service = {
  PaymentGatewayService: {
    PaymentGatewayPort: {
      ProcessPayment: async (args) => {
        const card = String(args?.cardNumber ?? '').replace(/\s+/g, '');

        if (card.endsWith('4001')) {
          throw {
            Fault: {
              faultcode: 'soap:Client',
              faultstring: 'Client.InsufficientFunds: fondos insuficientes',
            },
          };
        }

        if (card.endsWith('4002')) {
          throw {
            Fault: {
              faultcode: 'soap:Client',
              faultstring: 'Client.CardExpired: tarjeta vencida',
            },
          };
        }

        if (card.endsWith('5001')) {
          throw {
            Fault: {
              faultcode: 'soap:Server',
              faultstring: 'Server.InternalBankingError: core no disponible',
            },
          };
        }

        if (card.endsWith('7001')) {
          throw {
            Fault: {
              faultcode: 'soap:Server',
              faultstring: 'Server.GatewayUnavailable: pasarela no disponible',
            },
          };
        }

        if (card.endsWith('9999')) {
          await new Promise((resolve) => setTimeout(resolve, 6000));
        }

        return {
          approved: Number(args?.amount) > 0,
          transactionId: `WSDL-TX-${Date.now()}`,
          authCode: 'AUTH-WSDL',
          code: 'APPROVED',
        };
      },
    },
  },
};

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Defensa en profundidad XXE en el servidor SOAP mock: rechazar cualquier DOCTYPE/ENTITY.
  if (req.method === 'POST') {
    const chunks = [];
    const origOn = req.on.bind(req);
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      if (/<!DOCTYPE|<!ENTITY/i.test(body)) {
        res.writeHead(400, { 'Content-Type': 'text/xml; charset=utf-8' });
        res.end(
          '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>soap:Client</faultcode><faultstring>XXE_INJECTION_REJECTED</faultstring></soap:Fault></soap:Body></soap:Envelope>',
        );
      }
    });
    void origOn;
  }
});

soap.listen(httpServer, '/payments', service, wsdlXml);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`EventHub SOAP Mock listening on http://0.0.0.0:${PORT}/payments?wsdl`);
});
