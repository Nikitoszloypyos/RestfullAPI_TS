
import { DomainError } from './DomainError';

export class ValidationError extends DomainError {
      constructor(message: string, public readonly field?: string) {
            super(message);
            this.name = 'ValidationError';
      }
}
