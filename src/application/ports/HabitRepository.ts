import { Habit } from '../../domain/entities/Habit';

export interface HabitRepositoryFindOptions {
      includeArchived?: boolean;
}

export interface HabitRepository {
      findById(id: string): Promise<Habit | null>;

      findByVisitorId(
          visitorId: string,
          options?: HabitRepositoryFindOptions
      ): Promise<Habit[]>;

      save(habit: Habit): Promise<void>;

      delete(id: string): Promise<void>;
}
