import * as bcrypt from 'bcrypt'
import { PasswordHasher } from '../application/ports';

export class BcryptPasswordHasher implements PasswordHasher {
      constructor(private readonly rounds: number = 10) {}

      async hash(plain: string): Promise<string> {
            return bcrypt.hash(plain, this.rounds);
      }

      async compare(plain: string, hash: string): Promise<boolean> {
            return bcrypt.compare(plain, hash);
      }
}