import type { HabitRepository, TimeEntryRepository } from '../ports';

import { DateOnly } from '../../domain/value-objects/DateOnly';
import { StatsService } from '../../domain/services/StatsService';
import { AppValidationError } from '../../domain/errors';


export interface StatsHabitDTO {
      habitId: string;
      name: string;
      color?: string;
      minutes: number;
      percent: number;
}

export interface StatsDayHabitDTO {
      habitId: string;
      minutes: number;
}

export interface StatsDayDTO {
      date: string; // YYYY-MM-DD
      totalMinutes: number;
      byHabit: StatsDayHabitDTO[];
}

export interface StatsSummaryDTO {
      totalMinutes: number;
      avgPerWeekMinutes: number;
      byHabit: StatsHabitDTO[];
      byDay: StatsDayDTO[];
}

export interface GetStatsSummaryInput {
      ownerId: string;
      from: string; // YYYY-MM-DD
      to: string;   // YYYY-MM-DD
}

export type GetStatsSummaryOutput = StatsSummaryDTO;

 //Строит сводную статистику по привычкам и дням за период.

export class GetStatsSummaryUseCase {
      constructor(
          private readonly habitRepository: HabitRepository,
          private readonly timeEntryRepository: TimeEntryRepository
      ) {}

      async execute(
          input: GetStatsSummaryInput
      ): Promise<GetStatsSummaryOutput> {
            const { ownerId, from, to } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!from) {
                  throw new AppValidationError('from is required', 'from');
            }
            if (!to) {
                  throw new AppValidationError('to is required', 'to');
            }

            const fromDate = DateOnly.fromString(from);
            const toDate = DateOnly.fromString(to);

            if (fromDate.isAfter(toDate)) {
                  throw new AppValidationError(
                      '`from` cannot be after `to`',
                      'from'
                  );
            }

            const [habits, entries] = await Promise.all([
                  this.habitRepository.findByVisitorId(ownerId, {
                        includeArchived: true
                  }),
                  this.timeEntryRepository.findByVisitorAndDateRange({
                        visitorId: ownerId,
                        from: fromDate,
                        to: toDate
                  })
            ]);

            const summary = StatsService.buildSummary({
                  habits,
                  entries,
                  period: { from: fromDate, to: toDate }
            });

            return {
                  totalMinutes: summary.totalDuration.toMinutes(),
                  avgPerWeekMinutes: summary.avgPerWeekDuration.toMinutes(),
                  byHabit: summary.byHabit.map((h) => ({
                        habitId: h.habitId,
                        name: h.name,
                        color: h.color,
                        minutes: h.duration.toMinutes(),
                        percent: h.percent
                  })),
                  byDay: summary.byDay.map((d) => ({
                        date: d.date.toString(),
                        totalMinutes: d.totalDuration.toMinutes(),
                        byHabit: d.byHabit.map((bh) => ({
                              habitId: bh.habitId,
                              minutes: bh.duration.toMinutes()
                        }))
                  }))
            };
      }
}
