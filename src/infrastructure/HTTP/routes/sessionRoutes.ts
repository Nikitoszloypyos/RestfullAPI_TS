import { FastifyPluginAsync } from 'fastify';

export const sessionRoutes: FastifyPluginAsync = async (app) => {
      app.post(
          '/handshake',
          {
                schema: {
                      body: {
                            type: 'object',
                            properties: {
                                  userId: { type: 'string' }
                            },
                            required: [],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const body = (request.body || {}) as { userId?: string };
                const userId = body.userId;

                const cookies = (request.cookies || {}) as Record<
                    string,
                    string
                >;
                const anonymousVisitorId = cookies['owner_id'];

                const result = await app.ctx.registerVisitUseCase.execute({
                      anonymousVisitorId,
                      userId,
                });

                reply.setCookie('owner_id', result.ownerId, {
                      path: '/',
                      sameSite: 'lax'
                });

                reply.send(result);
          }
      );
};
