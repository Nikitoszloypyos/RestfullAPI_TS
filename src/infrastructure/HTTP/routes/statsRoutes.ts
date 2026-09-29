import { FastifyPluginAsync } from 'fastify';
import { getOwnerId } from './getOwnerId';
import { AppValidationError } from '../../../domain/errors';

export const statsRoutes: FastifyPluginAsync = async (app) => {
      app.get(
          '/summary',
          {
                schema: {
                      querystring: {
                            type: 'object',
                            properties: {
                                  from: { type: 'string' },
                                  to: { type: 'string' }
                            },
                            required: ['from', 'to'],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = getOwnerId(request);
                if (!ownerId) {
                      throw new AppValidationError('ownerId is required', 'ownerId');
                }

                const query = request.query as { from: string; to: string };

                const summary =
                    await app.ctx.getStatsSummaryUseCase.execute({
                          ownerId,
                          from: query.from,
                          to: query.to
                    });

                reply.send(summary);
          }
      );
};
