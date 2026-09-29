import { FastifyPluginAsync } from 'fastify';
import { getOwnerId } from './getOwnerId';
import { AppValidationError } from '../../../domain/errors';

const idParamsSchema = {
      type: 'object',
      properties: {
            id: { type: 'string', minLength: 1 }
      },
      required: ['id'],
      additionalProperties: false
} as const;

const dateSchema = {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$'
} as const;

export const timeEntryRoutes: FastifyPluginAsync = async (app) => {
      app.get(
          '/',
          {
                schema: {
                      querystring: {
                            type: 'object',
                            properties: {
                                  from: dateSchema,
                                  to: dateSchema
                            },
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const query = request.query as { from?: string; to?: string };

                if ((query.from && !query.to) || (!query.from && query.to)) {
                      throw new AppValidationError(
                          'from and to must be provided together',
                          query.from ? 'to' : 'from'
                      );
                }

                const entries = query.from && query.to
                    ? await app.ctx.listTimeEntriesForPeriodUseCase.execute({
                          ownerId,
                          from: query.from,
                          to: query.to
                    })
                    : await app.ctx.listTimeEntriesUseCase.execute({ ownerId });

                reply.send({ list: entries });
          }
      );

      app.get(
          '/:id',
          { schema: { params: idParamsSchema } },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const params = request.params as { id: string };
                const timeEntry = await app.ctx.getTimeEntryUseCase.execute({
                      ownerId,
                      timeEntryId: params.id
                });

                reply.send({ timeEntry });
          }
      );

      app.post(
          '/',
          {
                schema: {
                      body: {
                            type: 'object',
                            properties: {
                                  habitId: { type: 'string', minLength: 1 },
                                  date: dateSchema,
                                  durationMinutes: { type: 'integer', minimum: 1 },
                                  source: { type: 'string', maxLength: 50 }
                            },
                            required: ['habitId', 'date', 'durationMinutes'],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const body = request.body as {
                      habitId: string;
                      date: string;
                      durationMinutes: number;
                      source?: string;
                };
                const timeEntry = await app.ctx.addTimeEntryUseCase.execute({
                      ownerId,
                      habitId: body.habitId,
                      date: body.date,
                      durationMinutes: body.durationMinutes,
                      source: body.source
                });

                reply.status(200).send({ timeEntry });
          }
      );

      app.patch(
          '/:id',
          {
                schema: {
                      params: idParamsSchema,
                      body: {
                            type: 'object',
                            properties: {
                                  habitId: { type: 'string', minLength: 1 },
                                  date: dateSchema,
                                  durationMinutes: { type: 'integer', minimum: 1 },
                                  source: {
                                        type: ['string', 'null'],
                                        maxLength: 50
                                  }
                            },
                            minProperties: 1,
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const params = request.params as { id: string };
                const body = request.body as {
                      habitId?: string;
                      date?: string;
                      durationMinutes?: number;
                      source?: string | null;
                };
                const timeEntry = await app.ctx.updateTimeEntryUseCase.execute({
                      ownerId,
                      timeEntryId: params.id,
                      ...(Object.hasOwn(body, 'habitId') ? { habitId: body.habitId } : {}),
                      ...(Object.hasOwn(body, 'date') ? { date: body.date } : {}),
                      ...(Object.hasOwn(body, 'durationMinutes')
                          ? { durationMinutes: body.durationMinutes }
                          : {}),
                      ...(Object.hasOwn(body, 'source') ? { source: body.source } : {})
                });

                reply.send({ timeEntry });
          }
      );

      app.delete(
          '/:id',
          { schema: { params: idParamsSchema } },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const params = request.params as { id: string };
                await app.ctx.deleteTimeEntryUseCase.execute({
                      ownerId,
                      timeEntryId: params.id
                });

                reply.status(202).send();
          }
      );
};

function requireOwnerId(request: Parameters<typeof getOwnerId>[0]): string {
      const ownerId = getOwnerId(request);
      if (!ownerId) {
            throw new AppValidationError('ownerId is required', 'ownerId');
      }
      return ownerId;
}
