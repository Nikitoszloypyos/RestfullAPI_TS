import type { UserRepository, PasswordHasher } from '../../ports';
import  { AppValidationError, AuthError } from '../../../domain/errors';


export interface LoginWithMailRuInput {
      email: string;
      password: string;
}

export interface LoginWithMailRuOutput {
      userId: string;
      email: string;
}


 // Логин по email @mail.ru + пароль.

export class LoginWithMailRuUseCase {
      constructor(
          private readonly userRepository: UserRepository,
          private readonly passwordHasher: PasswordHasher
      ) {}

      async execute(
          input: LoginWithMailRuInput
      ): Promise<LoginWithMailRuOutput> {
            const email = input.email.trim().toLowerCase();
            const password = input.password;

            if (!email) {
                  throw new AppValidationError('Email is required', 'email');
            }
            if (!email.endsWith('@mail.ru')) {
                  throw new AppValidationError(
                      'Only @mail.ru emails are allowed',
                      'email'
                  );
            }
            if (!password) {
                  throw new AppValidationError('Password is required', 'password');
            }

            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                  throw new AuthError('Invalid email or password');
            }

            const ok = await this.passwordHasher.compare(
                password,
                user.passwordHash
            );
            if (!ok) {
                  throw new AuthError('Invalid email or password');
            }

            return {
                  userId: user.id,
                  email: user.email
            };
      }
}
