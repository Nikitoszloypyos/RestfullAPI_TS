import { prisma } from '../DB/prismaClient';
import { User } from '../../domain/entities/User';
import type { UserRepository } from '../../application/ports';

export class DbUserRepository implements UserRepository {
      async findById(id: string): Promise<User | null> {
            const record = await prisma.user.findUnique({ where: { id } });
            if (!record) return null;

            return User.restore({
                  id: record.id,
                  email: record.email,
                  passwordHash: record.passwordHash,
                  createdAt: record.createdAt
            });
      }

      async findByEmail(email: string): Promise<User | null> {
            const record = await prisma.user.findUnique({ where: { email } });
            if (!record) return null;

            return User.restore({
                  id: record.id,
                  email: record.email,
                  passwordHash: record.passwordHash,
                  createdAt: record.createdAt
            });
      }

      async save(user: User): Promise<void> {
            await prisma.user.upsert({
                  where: { id: user.id },
                  create: {
                        id: user.id,
                        email: user.email,
                        passwordHash: user.passwordHash,
                        createdAt: user.createdAt
                  },
                  update: {
                        email: user.email,
                        passwordHash: user.passwordHash
                  }
            });
      }
}
