import fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';

import type { AppContext } from '../composition/appContext';
import {
      AppValidationError,
      AuthError,
      ForbiddenError,
      NotFoundError,
      ValidationError
} from '../../domain/errors';

import { sessionRoutes } from './routes/sessionRoutes';
import { authRoutes } from './routes/authRoutes';
import { habitRoutes } from './routes/habitRoutes';
import { timeEntryRoutes } from './routes/timeEntryRoutes';
import { statsRoutes } from './routes/statsRoutes';

declare module 'fastify' {
      interface FastifyInstance {
            ctx: AppContext;
      }
}

export function createServer(
    ctx: AppContext,
    options: { logger?: boolean } = {}
): FastifyInstance {
      const app = fastify({ logger: options.logger ?? true });

      app.decorate('ctx', ctx);

      app.register(cookie, {
            // можно добавить secret при необходимости
      });

      app.register(cors, {
            origin: true,
            credentials: true
      });

      app.register(sessionRoutes, { prefix: '/session' });
      app.register(authRoutes, { prefix: '/auth' });
      app.register(habitRoutes, { prefix: '/habits' });
      app.register(timeEntryRoutes, { prefix: '/time-entries' });
      app.register(habitRoutes, { prefix: '/api/habits' });
      app.register(timeEntryRoutes, { prefix: '/api/time-entries' });
      app.register(statsRoutes, { prefix: '/stats' });

      app.setErrorHandler((err, request, reply) => {
            request.log.error(err);

            // Fastify валидационные ошибки
            if ((err as any).validation) {
                  reply.status(400).send({
                        status: 400,
                        reason: err instanceof Error
                            ? err.message
                            : 'Invalid request'
                  });
                  return;
            }

            if (err instanceof AppValidationError || err instanceof ValidationError) {
                  reply.status(400).send({
                        status: 400,
                        reason: err.message
                  });
                  return;
            }

            if (err instanceof NotFoundError) {
                  reply.status(404).send({
                        status: 404,
                        reason: err.message
                  });
                  return;
            }

            if (err instanceof ForbiddenError) {
                  reply.status(403).send({
                        status: 403,
                        reason: err.message
                  });
                  return;
            }

            if (err instanceof AuthError) {
                  reply.status(401).send({
                        status: 401,
                        reason: err.message
                  });
                  return;
            }

            reply.status(500).send({
                  status: 500,
                  reason: 'Internal server error'
            });
      });

      return app;
}
