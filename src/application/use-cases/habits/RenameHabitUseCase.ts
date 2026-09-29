import type { HabitRepository } from '../../ports';
import { HabitName } from '../../../domain/value-objects/HabitName';
import { AppValidationError, NotFoundError,  ForbiddenError} from '../../../domain/errors';

import { type HabitDTO, toHabitDTO } from './HabitDTO';

export interface RenameHabitInput {
      ownerId: string;
      habitId: string;
      newName: string;
}

export type RenameHabitOutput = HabitDTO;


 //Переименовывает привычку, проверяя, что она принадлежит владельцу.

export class RenameHabitUseCase {
      constructor(
          private readonly habitRepository: HabitRepository
      ) {}

      async execute(input: RenameHabitInput): Promise<RenameHabitOutput> {
            const { ownerId, habitId, newName } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!habitId) {
                  throw new AppValidationError('habitId is required', 'habitId');
            }
            if (!newName || !newName.trim()) {
                  throw new AppValidationError('newName is required', 'newName');
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

            habit.rename(HabitName.create(newName));

            await this.habitRepository.save(habit);

            return toHabitDTO(habit);
      }
}
