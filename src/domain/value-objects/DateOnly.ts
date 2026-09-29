import { ValidationError } from '../errors/ValidationError';

export class DateOnly {
      private constructor(private readonly value: string) {}

      static fromString(value: string): DateOnly {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  throw new ValidationError(
                      'DateOnly must be in format YYYY-MM-DD',
                      'date'
                  );
            }

            const parsed = new Date(`${value}T00:00:00.000Z`);
            if (
                Number.isNaN(parsed.getTime()) ||
                parsed.toISOString().slice(0, 10) !== value
            ) {
                  throw new ValidationError('DateOnly must be a valid date', 'date');
            }

            return new DateOnly(value);
      }

      static fromDate(date: Date): DateOnly {
            const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD
            return new DateOnly(iso);
      }

      toString(): string {
            return this.value;
      }

      private toJsDate(): Date {
            // интерпретируем как полночь UTC
            return new Date(this.value + 'T00:00:00.000Z');
      }

      isBefore(other: DateOnly): boolean {
            return this.toJsDate().getTime() < other.toJsDate().getTime();
      }

      isAfter(other: DateOnly): boolean {
            return this.toJsDate().getTime() > other.toJsDate().getTime();
      }

      isEqual(other: DateOnly): boolean {
            return this.value === other.value;
      }

      isBetweenInclusive(from: DateOnly, to: DateOnly): boolean {
            const time = this.toJsDate().getTime();
            const fromTime = from.toJsDate().getTime();
            const toTime = to.toJsDate().getTime();
            return time >= fromTime && time <= toTime;
      }

      compare(other: DateOnly): number {
            const thisTime = this.toJsDate().getTime();
            const otherTime = other.toJsDate().getTime();
            if (thisTime < otherTime) return -1;
            if (thisTime > otherTime) return 1;
            return 0;
      }

      daysUntilInclusive(other: DateOnly): number {
            const msPerDay = 24 * 60 * 60 * 1000;
            const start = this.toJsDate().getTime();
            const end = other.toJsDate().getTime();

            if (end < start) return 0;

            const diff = end - start;
            return Math.floor(diff / msPerDay) + 1;
      }
}
