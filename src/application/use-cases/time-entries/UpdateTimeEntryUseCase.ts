import type { HabitRepository, TimeEntryRepository } from '../../ports';
import type { TimeEntrySource } from '../../../domain/entities/TimeEntry';
import { DateOnly } from '../../../domain/value-objects/DateOnly';
import { Duration } from '../../../domain/value-objects/Duration';
import { AppValidationError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { type TimeEntryDTO, toTimeEntryDTO } from './TimeEntryDTO';

export interface UpdateTimeEntryInput {
      ownerId: string;
      timeEntryId: string;
      habitId?: string;
      date?: string;
      durationMinutes?: number;
      source?: TimeEntrySource | null;
}

export class UpdateTimeEntryUseCase {
      constructor(
          private readonly timeEntryRepository: TimeEntryRepository,
          private readonly habitRepository: HabitRepository
      ) {}

      async execute(input: UpdateTimeEntryInput): Promise<TimeEntryDTO> {
            if (!input.ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!input.timeEntryId) {
                  throw new AppValidationError('timeEntryId is required', 'timeEntryId');
            }

            const mutableFields = ['habitId', 'date', 'durationMinutes', 'source'] as const;
            if (!mutableFields.some((field) => Object.hasOwn(input, field))) {
                  throw new AppValidationError('At least one field is required');
            }

            const entry = await this.timeEntryRepository.findById(input.timeEntryId);
            if (!entry) {
                  throw new NotFoundError('Time entry not found');
            }
            if (entry.visitorId !== input.ownerId) {
                  throw new ForbiddenError('You do not have permission to modify this time entry');
            }

            if (Object.hasOwn(input, 'habitId')) {
                  if (!input.habitId) {
                        throw new AppValidationError('habitId is required', 'habitId');
                  }
                  const habit = await this.habitRepository.findById(input.habitId);
                  if (!habit) {
                        throw new NotFoundError('Habit not found');
                  }
                  if (habit.visitorId !== input.ownerId) {
                        throw new ForbiddenError('You do not have permission to use this habit');
                  }
                  entry.changeHabit(input.habitId);
            }
            if (Object.hasOwn(input, 'date')) {
                  if (!input.date) {
                        throw new AppValidationError('date is required', 'date');
                  }
                  entry.changeDate(DateOnly.fromString(input.date));
            }
            if (Object.hasOwn(input, 'durationMinutes')) {
                  const durationMinutes = input.durationMinutes;
                  if (
                      typeof durationMinutes !== 'number' ||
                      !Number.isInteger(durationMinutes) ||
                      durationMinutes <= 0
                  ) {
                        throw new AppValidationError(
                            'durationMinutes must be a positive integer',
                            'durationMinutes'
                        );
                  }
                  entry.changeDuration(Duration.fromMinutes(durationMinutes));
            }
            if (Object.hasOwn(input, 'source')) {
                  entry.changeSource(input.source ?? undefined);
            }

            await this.timeEntryRepository.save(entry);
            return toTimeEntryDTO(entry);
      }
}
