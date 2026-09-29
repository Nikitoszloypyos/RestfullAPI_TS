import { randomUUID } from 'crypto';
import { IdGenerator } from '../application/ports';

export class UuidIdGenerator implements IdGenerator {
      generate(): string {
            return randomUUID();
      }
}