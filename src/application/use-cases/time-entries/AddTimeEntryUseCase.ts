import { TimeEntry, type TimeEntrySource } from '../../../domain/entities/TimeEntry';
import { DateOnly } from '../../../domain/value-objects/DateOnly';
import { Duration } from '../../../domain/value-objects/Duration';

import type { TimeEntryRepository, HabitRepository } from '../../ports';
import type { Clock, IdGenerator } from '../../ports';

import { AppValidationError, NotFoundError, ForbiddenError } from '../../../domain/errors';

import { type TimeEntryDTO, toTimeEntryDTO } from './TimeEntryDTO';


export interface AddTimeEntryInput {
      ownerId: string;
      habitId: string;
      date: string; // YYYY-MM-DD
      durationMinutes: number;
      source?: TimeEntrySource;
}

export type AddTimeEntryOutput = TimeEntryDTO;

/**
 * Добавляет запись времени по привычке.
 */
export class AddTimeEntryUseCase {
      constructor(
          private readonly timeEntryRepository: TimeEntryRepository,
          private readonly habitRepository: HabitRepository,
          private readonly clock: Clock,
          private readonly idGenerator: IdGenerator
      ) {}

      async execute(input: AddTimeEntryInput): Promise<AddTimeEntryOutput> {
            const { ownerId, habitId, date, durationMinutes, source } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!habitId) {
                  throw new AppValidationError('habitId is required', 'habitId');
            }
            if (!date) {
                  throw new AppValidationError('date is required', 'date');
            }
            if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
                  throw new AppValidationError(
                      'durationMinutes must be a positive integer',
                      'durationMinutes'
                  );
            }

            const habit = await this.habitRepository.findById(habitId);
            if (!habit) {
                  throw new NotFoundError('Habit not found');
            }
            if (habit.visitorId !== ownerId) {
                  throw new ForbiddenError(
                      'You do not have permission to add time to this habit'
                  );
            }

            const dateOnly = DateOnly.fromString(date);
            const duration = Duration.fromMinutes(durationMinutes);

            const id = this.idGenerator.generate();
            const now = this.clock.now();

            const entry = TimeEntry.createNew({
                  id,
                  visitorId: ownerId,
                  habitId,
                  date: dateOnly,
                  duration,
                  source,
                  createdAt: now
            });

            await this.timeEntryRepository.save(entry);

            return toTimeEntryDTO(entry);
      }
}
