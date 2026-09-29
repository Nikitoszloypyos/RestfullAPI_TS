import { prisma } from '../DB/prismaClient';

import { Visitor } from '../../domain/entities/Visitor';
import type{ VisitorRepository } from '../../application/ports';


export class DbVisitorRepository implements VisitorRepository {
      async findById(id: string): Promise<Visitor | null> {
            const record = await prisma.visitor.findUnique({ where: { id } });
            if (!record) return null;

            return Visitor.restore({
                  id: record.id,
                  createdAt: record.createdAt,
                  lastVisitAt: record.lastVisitAt,
                  visitCount: record.visitCount
            });
      }

      async save(visitor: Visitor): Promise<void> {
            await prisma.visitor.upsert({
                  where: { id: visitor.id },
                  create: {
                        id: visitor.id,
                        createdAt: visitor.createdAt,
                        lastVisitAt: visitor.lastVisitAt,
                        visitCount: visitor.visitCount
                  },
                  update: {
                        lastVisitAt: visitor.lastVisitAt,
                        visitCount: visitor.visitCount
                  }
            });
      }
}
