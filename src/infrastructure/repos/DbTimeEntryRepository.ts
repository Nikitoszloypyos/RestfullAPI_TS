import { prisma } from '../DB/prismaClient';

import { TimeEntry } from '../../domain/entities/TimeEntry';
import { DateOnly } from '../../domain/value-objects/DateOnly';
import { Duration } from '../../domain/value-objects/Duration';

import type { TimeEntryRepository, TimeEntriesByPeriodParams } from '../../application/ports';


export class DbTimeEntryRepository implements TimeEntryRepository {
      async findById(id: string): Promise<TimeEntry | null> {
            const record = await prisma.timeEntry.findUnique({ where: { id } });
            if (!record) return null;

            return TimeEntry.restore({
                  id: record.id,
                  visitorId: record.ownerId,
                  habitId: record.habitId,
                  date: DateOnly.fromString(record.date),
                  duration: Duration.fromMinutes(record.durationMinutes),
                  source: record.source ?? undefined,
                  createdAt: record.createdAt
            });
      }

      async findByVisitorId(visitorId: string): Promise<TimeEntry[]> {
            const records = await prisma.timeEntry.findMany({
                  where: { ownerId: visitorId }
            });

            return records.map((record) => this.toDomain(record));
      }

      async findByVisitorAndDateRange(
          params: TimeEntriesByPeriodParams
      ): Promise<TimeEntry[]> {
            const records = await prisma.timeEntry.findMany({
                  where: {
                        ownerId: params.visitorId,
                        date: {
                              gte: params.from.toString(),
                              lte: params.to.toString()
                        }
                  }
            });

            return records.map((record) => this.toDomain(record));
      }

      async save(entry: TimeEntry): Promise<void> {
            const data = {
                  id: entry.id,
                  ownerId: entry.visitorId,
                  habitId: entry.habitId,
                  date: entry.date.toString(),
                  durationMinutes: entry.duration.toMinutes(),
                  source: entry.source ?? null,
                  createdAt: entry.createdAt
            };

            await prisma.timeEntry.upsert({
                  where: { id: entry.id },
                  create: data,
                  update: {
                        ownerId: data.ownerId,
                        habitId: data.habitId,
                        date: data.date,
                        durationMinutes: data.durationMinutes,
                        source: data.source
                  }
            });
      }

      async delete(id: string): Promise<void> {
            await prisma.timeEntry.delete({ where: { id } });
      }

      private toDomain(record: {
            id: string;
            ownerId: string;
            habitId: string;
            date: string;
            durationMinutes: number;
            source: string | null;
            createdAt: Date;
      }): TimeEntry {
            return TimeEntry.restore({
                  id: record.id,
                  visitorId: record.ownerId,
                  habitId: record.habitId,
                  date: DateOnly.fromString(record.date),
                  duration: Duration.fromMinutes(record.durationMinutes),
                  source: record.source ?? undefined,
                  createdAt: record.createdAt
            });
      }
}
