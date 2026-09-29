import { AppError } from './AppError';

export class AppValidationError extends AppError {
      constructor(message: string, public readonly field?: string) {
            super(message, 'VALIDATION_ERROR');
            this.name = 'AppValidationError';
      }
}