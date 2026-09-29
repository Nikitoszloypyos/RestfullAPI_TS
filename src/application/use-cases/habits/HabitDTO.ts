import { Habit } from '../../../domain/entities/Habit';

export interface HabitDTO {
      id: string;
      name: string;
      color?: string;
      isArchived: boolean;
      createdAt: string;
      orderIndex?: number;
}

export function toHabitDTO(habit: Habit): HabitDTO {
      return {
            id: habit.id,
            name: habit.name.toString(),
            color: habit.color,
            isArchived: habit.isArchived,
            createdAt: habit.createdAt.toISOString(),
            orderIndex: habit.orderIndex
      };
}
