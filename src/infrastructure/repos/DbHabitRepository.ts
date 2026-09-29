import { prisma } from '../DB/prismaClient';

import { Habit } from '../../domain/entities/Habit';
import { HabitName } from '../../domain/value-objects/HabitName';

import type { HabitRepository, HabitRepositoryFindOptions } from '../../application/ports';


export class DbHabitRepository implements HabitRepository {
      async findById(id: string): Promise<Habit | null> {
            const record = await prisma.habit.findUnique({ where: { id } });
            if (!record)  {
                  return null;
            }

            return Habit.restore({
                  id: record.id,
                  visitorId: record.ownerId, // ownerId в БД = visitorId/ownerId в домене
                  name: HabitName.create(record.name),
                  color: record.color ?? undefined,
                  isArchived: record.isArchived,
                  createdAt: record.createdAt,
                  orderIndex: record.orderIndex ?? undefined
            });
      }

      async findByVisitorId(
          visitorId: string,
          options?: HabitRepositoryFindOptions
      ): Promise<Habit[]> {
            const includeArchived = options?.includeArchived ?? false;

            const records = await prisma.habit.findMany({
                  where: {
                        ownerId: visitorId,
                        ...(includeArchived ? {} : { isArchived: false })
                  }
            });

            return records.map(
                (record) =>
                    Habit.restore({
                          id: record.id,
                          visitorId: record.ownerId,
                          name: HabitName.create(record.name),
                          color: record.color ?? undefined,
                          isArchived: record.isArchived,
                          createdAt: record.createdAt,
                          orderIndex: record.orderIndex ?? undefined
                    })
            );
      }

      async save(habit: Habit): Promise<void> {
            const data = {
                  id: habit.id,
                  ownerId: habit.visitorId,
                  name: habit.name.toString(),
                  color: habit.color ?? null,
                  isArchived: habit.isArchived,
                  createdAt: habit.createdAt,
                  orderIndex: habit.orderIndex ?? null
            };

            await prisma.habit.upsert({
                  where: { id: habit.id },
                  create: data,
                  update: {
                        ownerId: data.ownerId,
                        name: data.name,
                        color: data.color,
                        isArchived: data.isArchived,
                        orderIndex: data.orderIndex
                  }
            });
      }

      async delete(id: string): Promise<void> {
            await prisma.habit.delete({ where: { id } });
      }
}
