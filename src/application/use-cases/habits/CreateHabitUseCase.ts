import { Habit } from '../../../domain/entities/Habit';
import { HabitName } from '../../../domain/value-objects/HabitName';

import type { HabitRepository } from '../../ports';
import type { Clock,  IdGenerator} from '../../ports';

import { AppValidationError } from '../../../domain/errors';

import {type HabitDTO, toHabitDTO } from './HabitDTO';


export interface CreateHabitInput {
      ownerId: string;
      name: string;
      color?: string;
      orderIndex?: number;
}

export type CreateHabitOutput = HabitDTO;

export class CreateHabitUseCase {
      constructor(
          private readonly habitRepository: HabitRepository,
          private readonly clock: Clock,
          private readonly idGenerator: IdGenerator
      ) {}

      async execute(input: CreateHabitInput): Promise<CreateHabitOutput> {
            const { ownerId, name, color, orderIndex } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!name || !name.trim()) {
                  throw new AppValidationError('Name is required', 'name');
            }

            const id = this.idGenerator.generate();
            const now = this.clock.now();
            const habitName = HabitName.create(name);

            const habit = Habit.createNew({
                  id,
                  visitorId: ownerId,
                  name: habitName,
                  color,
                  createdAt: now,
                  orderIndex
            });

            await this.habitRepository.save(habit);

            return toHabitDTO(habit);
      }
}
