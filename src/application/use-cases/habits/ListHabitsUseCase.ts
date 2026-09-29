import type { HabitRepository } from '../../ports';
import { AppValidationError } from '../../../domain/errors';
import { type HabitDTO, toHabitDTO } from './HabitDTO';

export interface ListHabitsInput {
      ownerId: string;
      includeArchived?: boolean;
}

export type ListHabitsOutput = HabitDTO[];


 //Возвращает список привычек для владельца.

export class ListHabitsUseCase {
      constructor(
          private readonly habitRepository: HabitRepository
      ) {}

      async execute(input: ListHabitsInput): Promise<ListHabitsOutput> {
            const { ownerId, includeArchived } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }

            const habits = await this.habitRepository.findByVisitorId(ownerId, {
                  includeArchived
            });

            // Сортировка: сначала по orderIndex, потом по createdAt (как пример)
            habits.sort((a, b) => {
                  const aIdx = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
                  const bIdx = b.orderIndex ?? Number.MAX_SAFE_INTEGER;

                  if (aIdx !== bIdx) {
                        return aIdx - bIdx;
                  }

                  return a.createdAt.getTime() - b.createdAt.getTime();
            });

            return habits.map(toHabitDTO);
      }
}
