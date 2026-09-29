import { DateOnly } from '../value-objects/DateOnly';
import { Duration } from '../value-objects/Duration';
import { ValidationError } from '../errors';

export type TimeEntrySource = 'timer' | 'pomodoro' | 'manual' | string;

export interface TimeEntryProps {
      id: string;
      visitorId: string;
      habitId: string;
      date: DateOnly;
      duration: Duration;
      source?: TimeEntrySource;
      createdAt: Date;
}

export class TimeEntry {
      private props: TimeEntryProps;

      private constructor(props: TimeEntryProps) {
            if (!props.id) {
                  throw new ValidationError('TimeEntry id is required', 'id');
            }
            if (!props.visitorId) {
                  throw new ValidationError('visitorId is required', 'visitorId');
            }
            if (!props.habitId) {
                  throw new ValidationError('habitId is required', 'habitId');
            }
            if (props.duration.toMinutes() <= 0) {
                  throw new ValidationError(
                      'TimeEntry duration must be greater than 0 minutes',
                      'duration'
                  );
            }

            this.props = { ...props };
      }

      static createNew(params: {
            id: string;
            visitorId: string;
            habitId: string;
            date: DateOnly;
            duration: Duration;
            source?: TimeEntrySource;
            createdAt: Date;
      }): TimeEntry {
            return new TimeEntry({
                  id: params.id,
                  visitorId: params.visitorId,
                  habitId: params.habitId,
                  date: params.date,
                  duration: params.duration,
                  source: params.source,
                  createdAt: params.createdAt
            });
      }

      static restore(props: TimeEntryProps): TimeEntry {
            return new TimeEntry(props);
      }

      get id(): string {
            return this.props.id;
      }

      get visitorId(): string {
            return this.props.visitorId;
      }

      get habitId(): string {
            return this.props.habitId;
      }

      get date(): DateOnly {
            return this.props.date;
      }

      get duration(): Duration {
            return this.props.duration;
      }

      get source(): TimeEntrySource | undefined {
            return this.props.source;
      }

      get createdAt(): Date {
            return this.props.createdAt;
      }

      changeDuration(newDuration: Duration): void {
            if (newDuration.toMinutes() <= 0) {
                  throw new ValidationError(
                      'TimeEntry duration must be greater than 0 minutes',
                      'duration'
                  );
            }
            this.props.duration = newDuration;
      }

      changeDate(newDate: DateOnly): void {
            this.props.date = newDate;
      }

      changeHabit(newHabitId: string): void {
            if (!newHabitId) {
                  throw new ValidationError('habitId is required', 'habitId');
            }
            this.props.habitId = newHabitId;
      }

      changeSource(newSource: TimeEntrySource | undefined): void {
            this.props.source = newSource;
      }
}
