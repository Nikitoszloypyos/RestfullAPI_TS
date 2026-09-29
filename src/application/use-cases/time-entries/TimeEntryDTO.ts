import { TimeEntry, type TimeEntrySource } from '../../../domain/entities/TimeEntry';

export interface TimeEntryDTO {
      id: string;
      habitId: string;
      date: string; // YYYY-MM-DD
      durationMinutes: number;
      source?: TimeEntrySource;
      createdAt: string;
}

export function toTimeEntryDTO(entry: TimeEntry): TimeEntryDTO {
      return {
            id: entry.id,
            habitId: entry.habitId,
            date: entry.date.toString(),
            durationMinutes: entry.duration.toMinutes(),
            source: entry.source,
            createdAt: entry.createdAt.toISOString()
      };
}
