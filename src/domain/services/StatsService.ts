import { Habit } from '../entities/Habit';
import { TimeEntry } from '../entities/TimeEntry';
import { DateOnly } from '../value-objects/DateOnly';
import { Duration } from '../value-objects/Duration';

import type {
      StatsSummary,
      HabitStats,
      DayStats,
      DayHabitStats
} from './StatsModels.ts';

export interface StatsPeriod {
      from: DateOnly;
      to: DateOnly;
}

export class StatsService {
      static buildSummary(params: {
            habits: Habit[];
            entries: TimeEntry[];
            period: StatsPeriod;
      }): StatsSummary {
            const { habits, entries, period } = params;

            // Фильтруем записи по диапазону дат
            const filteredEntries = entries.filter((entry) =>
                entry.date.isBetweenInclusive(period.from, period.to)
            );

            if (filteredEntries.length === 0) {
                  return {
                        totalDuration: Duration.zero(),
                        avgPerWeekDuration: Duration.zero(),
                        byHabit: [],
                        byDay: []
                  };
            }

            // Общая длительность
            const totalMinutes = filteredEntries.reduce(
                (sum, entry) => sum + entry.duration.toMinutes(),
                0
            );
            const totalDuration = Duration.fromMinutes(totalMinutes);

            // 1) Группировка по привычкам

            const minutesByHabit = new Map<string, number>();

            for (const entry of filteredEntries) {
                  const current = minutesByHabit.get(entry.habitId) ?? 0;
                  minutesByHabit.set(entry.habitId, current + entry.duration.toMinutes());
            }

            const habitsById = new Map<string, Habit>();
            for (const h of habits) {
                  habitsById.set(h.id, h);
            }

            const byHabit: HabitStats[] = [];
            for (const [habitId, minutes] of minutesByHabit.entries()) {
                  const habit = habitsById.get(habitId);
                  if (!habit) {
                        // Запись относится к привычке, которую мы сейчас не знаем
                        continue;
                  }

                  const duration = Duration.fromMinutes(minutes);
                  const percent =
                      totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;

                  byHabit.push({
                        habitId,
                        name: habit.name.toString(),
                        color: habit.color,
                        duration,
                        percent
                  });
            }

            // сортируем по убыванию затраченного времени
            byHabit.sort(
                (a, b) => b.duration.toMinutes() - a.duration.toMinutes()
            );

            // 2) Группировка по дням

            const perDay = new Map<
                string,
                { totalMinutes: number; byHabitMinutes: Map<string, number> }
            >();

            for (const entry of filteredEntries) {
                  const dateKey = entry.date.toString();
                  let bucket = perDay.get(dateKey);

                  if (!bucket) {
                        bucket = {
                              totalMinutes: 0,
                              byHabitMinutes: new Map<string, number>()
                        };
                        perDay.set(dateKey, bucket);
                  }

                  const minutes = entry.duration.toMinutes();
                  bucket.totalMinutes += minutes;

                  const currentHabitMinutes =
                      bucket.byHabitMinutes.get(entry.habitId) ?? 0;
                  bucket.byHabitMinutes.set(entry.habitId, currentHabitMinutes + minutes);
            }

            const byDay: DayStats[] = [];

            for (const [dateKey, bucket] of perDay.entries()) {
                  const byHabitForDay: DayHabitStats[] = [];

                  for (const [habitId, minutes] of bucket.byHabitMinutes.entries()) {
                        byHabitForDay.push({
                              habitId,
                              duration: Duration.fromMinutes(minutes)
                        });
                  }

                  // сортируем внутри дня по длительности
                  byHabitForDay.sort(
                      (a, b) => b.duration.toMinutes() - a.duration.toMinutes()
                  );

                  byDay.push({
                        date: DateOnly.fromString(dateKey),
                        totalDuration: Duration.fromMinutes(bucket.totalMinutes),
                        byHabit: byHabitForDay
                  });
            }

            // сортировка дней по дате
            byDay.sort((a, b) => a.date.compare(b.date));

            // 3) Среднее за неделю
            const daysInPeriod = Math.max(
                1,
                period.from.daysUntilInclusive(period.to)
            );

            const avgMinutesPerWeek =
                daysInPeriod > 0
                    ? Math.round((totalMinutes * 7) / daysInPeriod)
                    : 0;

            const avgPerWeekDuration = Duration.fromMinutes(avgMinutesPerWeek);

            return {
                  totalDuration,
                  avgPerWeekDuration,
                  byHabit,
                  byDay
            };
      }
}
