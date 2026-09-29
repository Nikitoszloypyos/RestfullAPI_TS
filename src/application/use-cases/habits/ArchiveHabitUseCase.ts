import type { HabitRepository } from '../../ports';
import { AppValidationError, NotFoundError,  ForbiddenError} from '../../../domain/errors';

import {type HabitDTO, toHabitDTO } from './HabitDTO';

export interface ArchiveHabitInput {
      ownerId: string;
      habitId: string;
      archive: boolean;
}

export type ArchiveHabitOutput = HabitDTO;

export class ArchiveHabitUseCase {
      constructor(
          private readonly habitRepository: HabitRepository
      ) {}

      async execute(
          input: ArchiveHabitInput
      ): Promise<ArchiveHabitOutput> {
            const { ownerId, habitId, archive } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!habitId) {
                  throw new AppValidationError('habitId is required', 'habitId');
            }

            const habit = await this.habitRepository.findById(habitId);

            if (!habit) {
                  throw new NotFoundError('Habit not found');
            }
            if (habit.visitorId !== ownerId) {
                  throw new ForbiddenError(
                      'You do not have permission to modify this habit'
                  );
            }

            if (archive) {
                  habit.archive();
            } else {
                  habit.unarchive();
            }

            await this.habitRepository.save(habit);

            return toHabitDTO(habit);
      }
}
