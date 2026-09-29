import { TimeEntry } from '../../domain/entities/TimeEntry';
import { DateOnly } from '../../domain/value-objects/DateOnly';

export interface TimeEntriesByPeriodParams {
      visitorId: string;
      from: DateOnly;
      to: DateOnly;
}

export interface TimeEntryRepository {

      findById(id: string): Promise<TimeEntry | null>;

      findByVisitorId(visitorId: string): Promise<TimeEntry[]>;

      findByVisitorAndDateRange(
          params: TimeEntriesByPeriodParams
      ): Promise<TimeEntry[]>;

      save(entry: TimeEntry): Promise<void>;

      delete(id: string): Promise<void>;
}
