import { ValidationError } from '../errors';

export interface UserProps {
      id: string;
      email: string;
      passwordHash: string;
      createdAt: Date;
}

export class User {
      private props: UserProps;

      private constructor(props: UserProps) {
            if (!props.id) {
                  throw new ValidationError('User id is required', 'id');
            }

            const normalizedEmail = User.normalizeEmail(props.email);

            if (!User.isValidMailRuEmail(normalizedEmail)) {
                  throw new ValidationError(
                      'Email must be a valid @mail.ru address',
                      'email'
                  );
            }

            if (!props.passwordHash) {
                  throw new ValidationError(
                      'Password hash is required',
                      'passwordHash'
                  );
            }

            this.props = {
                  ...props,
                  email: normalizedEmail
            };
      }

      static createNew(params: {
            id: string;
            email: string;
            passwordHash: string;
            createdAt: Date;
      }): User {
            return new User({
                  id: params.id,
                  email: params.email,
                  passwordHash: params.passwordHash,
                  createdAt: params.createdAt
            });
      }

      static restore(props: UserProps): User {
            return new User(props);
      }

      get id(): string {
            return this.props.id;
      }

      get email(): string {
            return this.props.email;
      }

      get passwordHash(): string {
            return this.props.passwordHash;
      }

      get createdAt(): Date {
            return this.props.createdAt;
      }

      changePasswordHash(newHash: string): void {
            if (!newHash) {
                  throw new ValidationError(
                      'Password hash cannot be empty',
                      'passwordHash'
                  );
            }
            this.props.passwordHash = newHash;
      }

      private static normalizeEmail(email: string): string {
            return email.trim().toLowerCase();
      }

      private static isValidMailRuEmail(email: string): boolean {
            const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!basicRegex.test(email)) return false;
            return email.endsWith('@mail.ru');
      }
}
