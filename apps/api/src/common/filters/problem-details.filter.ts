import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  invalidParams?: Array<{ name: string; reason: string }>;
  timestamp: string;
}

const STATUS_TITLES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
  [HttpStatus.PRECONDITION_FAILED]: 'Precondition Failed',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'Gateway Timeout',
};

const STATUS_SLUGS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'bad-request',
  [HttpStatus.UNAUTHORIZED]: 'unauthorized',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not-found',
  [HttpStatus.CONFLICT]: 'conflict',
  [HttpStatus.PRECONDITION_FAILED]: 'precondition-failed',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'unprocessable-entity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'too-many-requests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'internal-server-error',
  [HttpStatus.BAD_GATEWAY]: 'bad-gateway',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'service-unavailable',
  [HttpStatus.GATEWAY_TIMEOUT]: 'gateway-timeout',
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let detail = 'An unexpected internal error occurred';
    let invalidParams: Array<{ name: string; reason: string }> | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        detail = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        if (Array.isArray(resObj.message)) {
          detail = resObj.message.join('; ');
          invalidParams = resObj.message.map(msg => ({
            name: typeof msg === 'string' ? msg.split(' ')[0] : 'field',
            reason: msg,
          }));
        } else if (resObj.message) {
          detail = String(resObj.message);
        } else if (resObj.detail) {
          detail = String(resObj.detail);
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    const title = STATUS_TITLES[status] || 'Error';
    const slug = STATUS_SLUGS[status] || 'error';

    const problemDetails: ProblemDetails = {
      type: `https://eventhub.com/errors/${slug}`,
      title,
      status,
      detail,
      instance: request.originalUrl || request.url,
      timestamp: new Date().toISOString(),
    };

    if (invalidParams && invalidParams.length > 0) {
      problemDetails.invalidParams = invalidParams;
    }

    // Mask sensitive parameters for security logs
    const sanitizedUrl = (request.originalUrl || request.url).replace(/(token|password|card)=[^&]+/gi, '$1=***');
    if (status >= 500) {
      this.logger.error(`[${status}] ${title} on ${sanitizedUrl}: ${detail}`);
    } else {
      this.logger.warn(`[${status}] ${title} on ${sanitizedUrl}: ${detail}`);
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(status).json(problemDetails);
  }
}
