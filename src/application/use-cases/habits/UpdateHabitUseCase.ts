import type { HabitRepository } from '../../ports';
import { HabitName } from '../../../domain/value-objects/HabitName';
import { AppValidationError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { type HabitDTO, toHabitDTO } from './HabitDTO';

export interface UpdateHabitInput {
      ownerId: string;
      habitId: string;
      name?: string;
      color?: string | null;
      orderIndex?: number | null;
      isArchived?: boolean;
}

export class UpdateHabitUseCase {
      constructor(private readonly habitRepository: HabitRepository) {}

      async execute(input: UpdateHabitInput): Promise<HabitDTO> {
            if (!input.ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!input.habitId) {
                  throw new AppValidationError('habitId is required', 'habitId');
            }

            const mutableFields = ['name', 'color', 'orderIndex', 'isArchived'] as const;
            if (!mutableFields.some((field) => Object.hasOwn(input, field))) {
                  throw new AppValidationError('At least one field is required');
            }

            const habit = await this.habitRepository.findById(input.habitId);
            if (!habit) {
                  throw new NotFoundError('Habit not found');
            }
            if (habit.visitorId !== input.ownerId) {
                  throw new ForbiddenError('You do not have permission to modify this habit');
            }

            if (Object.hasOwn(input, 'name')) {
                  if (!input.name || !input.name.trim()) {
                        throw new AppValidationError('name is required', 'name');
                  }
                  habit.rename(HabitName.create(input.name));
            }
            if (Object.hasOwn(input, 'color')) {
                  habit.changeColor(input.color ?? undefined);
            }
            if (Object.hasOwn(input, 'orderIndex')) {
                  habit.setOrderIndex(input.orderIndex ?? undefined);
            }
            if (Object.hasOwn(input, 'isArchived')) {
                  input.isArchived ? habit.archive() : habit.unarchive();
            }

            await this.habitRepository.save(habit);
            return toHabitDTO(habit);
      }
}
