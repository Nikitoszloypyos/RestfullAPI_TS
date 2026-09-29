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

export const habitRoutes: FastifyPluginAsync = async (app) => {
      app.get(
          '/',
          {
                schema: {
                      querystring: {
                            type: 'object',
                            properties: {
                                  includeArchived: {
                                        type: 'string',
                                        enum: ['true', 'false']
                                  }
                            },
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const query = request.query as { includeArchived?: string };
                const habits = await app.ctx.listHabitsUseCase.execute({
                      ownerId,
                      includeArchived: query.includeArchived === 'true'
                });

                reply.send({ list: habits });
          }
      );

      app.get(
          '/:id',
          { schema: { params: idParamsSchema } },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const params = request.params as { id: string };
                const habit = await app.ctx.getHabitUseCase.execute({
                      ownerId,
                      habitId: params.id
                });

                reply.send({ habit });
          }
      );

      app.post(
          '/',
          {
                schema: {
                      body: {
                            type: 'object',
                            properties: {
                                  name: { type: 'string', minLength: 1, maxLength: 100 },
                                  color: { type: 'string', maxLength: 50 },
                                  orderIndex: { type: 'integer', minimum: 0 }
                            },
                            required: ['name'],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const body = request.body as {
                      name: string;
                      color?: string;
                      orderIndex?: number;
                };
                const habit = await app.ctx.createHabitUseCase.execute({
                      ownerId,
                      name: body.name,
                      color: body.color,
                      orderIndex: body.orderIndex
                });

                reply.status(200).send({ habit });
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
                                  name: { type: 'string', minLength: 1, maxLength: 100 },
                                  newName: { type: 'string', minLength: 1, maxLength: 100 },
                                  color: {
                                        type: ['string', 'null'],
                                        maxLength: 50
                                  },
                                  orderIndex: {
                                        type: ['integer', 'null'],
                                        minimum: 0
                                  },
                                  isArchived: { type: 'boolean' }
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
                      name?: string;
                      newName?: string;
                      color?: string | null;
                      orderIndex?: number | null;
                      isArchived?: boolean;
                };
                const name = body.name ?? body.newName;
                const habit = await app.ctx.updateHabitUseCase.execute({
                      ownerId,
                      habitId: params.id,
                      ...(name !== undefined ? { name } : {}),
                      ...(Object.hasOwn(body, 'color') ? { color: body.color } : {}),
                      ...(Object.hasOwn(body, 'orderIndex')
                          ? { orderIndex: body.orderIndex }
                          : {}),
                      ...(Object.hasOwn(body, 'isArchived')
                          ? { isArchived: body.isArchived }
                          : {})
                });

                reply.send({ habit });
          }
      );

      app.patch(
          '/:id/archive',
          {
                schema: {
                      params: idParamsSchema,
                      body: {
                            type: 'object',
                            properties: {
                                  archive: { type: 'boolean' }
                            },
                            required: ['archive'],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const params = request.params as { id: string };
                const body = request.body as { archive: boolean };
                const habit = await app.ctx.archiveHabitUseCase.execute({
                      ownerId,
                      habitId: params.id,
                      archive: body.archive
                });

                reply.send({ habit });
          }
      );

      app.delete(
          '/:id',
          { schema: { params: idParamsSchema } },
          async (request, reply) => {
                const ownerId = requireOwnerId(request);
                const params = request.params as { id: string };
                await app.ctx.deleteHabitUseCase.execute({
                      ownerId,
                      habitId: params.id
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
