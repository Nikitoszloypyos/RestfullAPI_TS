import { Duration } from '../value-objects/Duration';
import { DateOnly } from '../value-objects/DateOnly';

export interface HabitStats {
      habitId: string;
      name: string;
      color?: string;
      duration: Duration;
      percent: number;
}

export interface DayHabitStats {
      habitId: string;
      duration: Duration;
}

export interface DayStats {
      date: DateOnly;
      totalDuration: Duration;
      byHabit: DayHabitStats[];
}

export interface StatsSummary {
      totalDuration: Duration;
      avgPerWeekDuration: Duration;
      byHabit: HabitStats[];
      byDay: DayStats[];
}
