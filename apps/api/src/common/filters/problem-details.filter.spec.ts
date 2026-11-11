import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ProblemDetailsFilter } from './problem-details.filter.js';

describe('ProblemDetailsFilter (Eje B: contrato de errores RFC 9457)', () => {
  let filter: ProblemDetailsFilter;
  let response: any;
  let request: any;
  let host: any;

  beforeEach(() => {
    filter = new ProblemDetailsFilter();
    response = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    request = { originalUrl: '/orders?password=secret', url: '/orders' };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    };
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('mapea una HttpException con respuesta string', () => {
    filter.catch(new HttpException('boom', HttpStatus.BAD_REQUEST), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      type: 'https://eventhub.com/errors/bad-request',
      title: 'Bad Request',
      detail: 'boom',
      instance: '/orders?password=secret',
    }));
  });

  it('mapea mensajes de validación en arreglo a invalidParams', () => {
    filter.catch(new BadRequestException(['email must be an email', 'password is too short']), host);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      detail: 'email must be an email; password is too short',
      invalidParams: [
        { name: 'email', reason: 'email must be an email' },
        { name: 'password', reason: 'password is too short' },
      ],
    }));
  });

  it('mapea un mensaje de validación con valor no string', () => {
    filter.catch(new BadRequestException(['ok', { nested: true } as any]), host);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      invalidParams: [
        { name: 'ok', reason: 'ok' },
        { name: 'field', reason: { nested: true } },
      ],
    }));
  });

  it('mapea un objeto con message', () => {
    filter.catch(new HttpException({ message: 'custom conflict' }, HttpStatus.CONFLICT), host);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 409,
      title: 'Conflict',
      detail: 'custom conflict',
    }));
  });

  it('mapea un objeto con detail', () => {
    filter.catch(new HttpException({ detail: 'detalle' }, HttpStatus.UNPROCESSABLE_ENTITY), host);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      detail: 'detalle',
      title: 'Unprocessable Entity',
    }));
  });

  it('usa Error para excepciones no HTTP y responde 500 sin filtrar el mensaje interno', () => {
    filter.catch(new Error('unexpected'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 500,
      title: 'Internal Server Error',
      detail: 'An unexpected internal error occurred',
    }));
  });

  it('usa valores por defecto para excepciones desconocidas', () => {
    filter.catch('string error', host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      detail: 'An unexpected internal error occurred',
    }));
  });

  it('usa title/slug genéricos y fallback de URL para status no mapeado', () => {
    request = { url: '/unknown' };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    };

    filter.catch(new HttpException('teapot', 418), host);

    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      type: 'https://eventhub.com/errors/error',
      title: 'Error',
      status: 418,
      instance: '/unknown',
    }));
  });

  it('sanea credenciales en los logs de error', () => {
    filter.catch(new HttpException('fail', HttpStatus.BAD_GATEWAY), host);

    expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('password=***'));
  });

  it('loguea como warning los errores 4xx', () => {
    filter.catch(new HttpException('fail', HttpStatus.NOT_FOUND), host);

    expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining('[404]'));
  });

  it('siempre responde application/problem+json', () => {
    filter.catch(new HttpException('x', HttpStatus.TOO_MANY_REQUESTS), host);

    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json');
  });
});
