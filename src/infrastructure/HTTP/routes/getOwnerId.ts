import { FastifyRequest } from 'fastify';

export function getOwnerId(request: FastifyRequest): string | undefined {
      const cookies = (request.cookies || {}) as Record<string, string>;
      const fromCookie = cookies['owner_id'];

      const header = request.headers['x-owner-id'];
      const fromHeader = Array.isArray(header) ? header[0] : header;

      return fromCookie || fromHeader;
}
