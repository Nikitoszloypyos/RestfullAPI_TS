import { FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (app) => {
      app.post(
          '/register',
          {
                schema: {
                      body: {
                            type: 'object',
                            properties: {
                                  email: { type: 'string' },
                                  password: { type: 'string' }
                            },
                            required: ['email', 'password'],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const body = request.body as {
                      email: string;
                      password: string;
                };

                const cookies = (request.cookies || {}) as Record<
                    string,
                    string
                >;
                const anonymousVisitorId = cookies['owner_id'];

                const result =
                    await app.ctx.registerWithMailRuUseCase.execute({
                          email: body.email,
                          password: body.password,
                          anonymousVisitorId
                    });

                reply.setCookie('owner_id', result.userId, {
                      path: '/',
                      sameSite: 'lax'
                });

                reply.send(result);
          }
      );

      app.post(
          '/login',
          {
                schema: {
                      body: {
                            type: 'object',
                            properties: {
                                  email: { type: 'string' },
                                  password: { type: 'string' }
                            },
                            required: ['email', 'password'],
                            additionalProperties: false
                      }
                }
          },
          async (request, reply) => {
                const body = request.body as {
                      email: string;
                      password: string;
                };

                const result = await app.ctx.loginWithMailRuUseCase.execute({
                      email: body.email,
                      password: body.password
                });

                reply.setCookie('owner_id', result.userId, {
                      path: '/',
                      sameSite: 'lax'
                });

                reply.send(result);
          }
      );
};
