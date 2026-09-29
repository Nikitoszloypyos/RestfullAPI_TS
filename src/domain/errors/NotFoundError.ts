import { AppError } from './AppError';

export class NotFoundError extends AppError {
      constructor(message: string) {
            super(message, 'NOT_FOUND');
            this.name = 'NotFoundError';
      }
}
