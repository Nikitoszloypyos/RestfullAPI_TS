import { ValidationError } from '../errors';

const MAX_NAME_LENGTH = 100;

export class HabitName {
      private constructor(private readonly value: string) {}

      static create(raw: string): HabitName {
            const trimmed = raw.trim();

            if (!trimmed) {
                  throw new ValidationError('Habit name cannot be empty', 'name');
            }

            if (trimmed.length > MAX_NAME_LENGTH) {
                  throw new ValidationError(
                      `Habit name is too long (max ${MAX_NAME_LENGTH} characters)`,
                      'name'
                  );
            }

            return new HabitName(trimmed);
      }

      toString(): string {
            return this.value;
      }
}
