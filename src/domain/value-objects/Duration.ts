import { ValidationError } from '../errors';


export class Duration {
      private readonly _minutes: number;

      private constructor(minutes: number) {
            this._minutes = minutes;
      }

      static fromMinutes(minutes: number): Duration {
            if (!Number.isInteger(minutes) || minutes < 0) {
                  throw new ValidationError(
                      'Duration minutes must be a non-negative integer',
                      'minutes'
                  );
            }
            return new Duration(minutes);
      }

      static fromHoursAndMinutes(hours: number, minutes: number): Duration {
            const total = hours * 60 + minutes;
            return Duration.fromMinutes(total);
      }

      static zero(): Duration {
            return new Duration(0);
      }

      get minutes(): number {
            return this._minutes;
      }

      toMinutes(): number {
            return this._minutes;
      }

      toHours(): number {
            return this._minutes / 60;
      }

      plus(other: Duration): Duration {
            return new Duration(this._minutes + other._minutes);
      }

      isZero(): boolean {
            return this._minutes === 0;
      }
}
