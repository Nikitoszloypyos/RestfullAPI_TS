import { AppError } from './AppError';

export class AuthError extends AppError {
      constructor(message: string) {
            super(message, 'AUTH_ERROR');
            this.name = 'AuthError';
      }
}