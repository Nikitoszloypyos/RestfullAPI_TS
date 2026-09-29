import type { HabitRepository } from '../../ports';
import { AppValidationError, ForbiddenError, NotFoundError } from '../../../domain/errors';

export interface DeleteHabitInput {
      ownerId: string;
      habitId: string;
}

export class DeleteHabitUseCase {
      constructor(private readonly habitRepository: HabitRepository) {}

      async execute(input: DeleteHabitInput): Promise<void> {
            if (!input.ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!input.habitId) {
                  throw new AppValidationError('habitId is required', 'habitId');
            }

            const habit = await this.habitRepository.findById(input.habitId);
            if (!habit) {
                  throw new NotFoundError('Habit not found');
            }
            if (habit.visitorId !== input.ownerId) {
                  throw new ForbiddenError('You do not have permission to delete this habit');
            }

            await this.habitRepository.delete(input.habitId);
      }
}
