import { User } from '../../../domain/entities/User';
import { Habit } from '../../../domain/entities/Habit';
import { TimeEntry } from '../../../domain/entities/TimeEntry';

import { DateOnly } from '../../../domain/value-objects/DateOnly';

import type { UserRepository, HabitRepository, TimeEntryRepository } from '../../ports';
import type { PasswordHasher } from '../../ports';
import type { IdGenerator, Clock } from '../../ports';

import { AppValidationError } from '../../../domain/errors';


export interface RegisterWithMailRuInput {
      email: string;
      password: string;
      anonymousVisitorId?: string | null;
}

export interface RegisterWithMailRuOutput {
      userId: string;
      email: string;
}

export class RegisterWithMailRuUseCase {
      constructor(
          private readonly userRepository: UserRepository,
          private readonly habitRepository: HabitRepository,
          private readonly timeEntryRepository: TimeEntryRepository,
          private readonly passwordHasher: PasswordHasher,
          private readonly idGenerator: IdGenerator,
          private readonly clock: Clock
      ) {}

      async execute(
          input: RegisterWithMailRuInput
      ): Promise<RegisterWithMailRuOutput> {
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
            if (!password || password.length < 6) {
                  throw new AppValidationError(
                      'Password must be at least 6 characters long',
                      'password'
                  );
            }

            const existing = await this.userRepository.findByEmail(email);
            if (existing) {
                  throw new AppValidationError(
                      'User with this email already exists',
                      'email'
                  );
            }

            const userId = this.idGenerator.generate();
            const now = this.clock.now();
            const passwordHash = await this.passwordHasher.hash(password);

            const user = User.createNew({
                  id: userId,
                  email,
                  passwordHash,
                  createdAt: now
            });

            await this.userRepository.save(user);

            if (input.anonymousVisitorId && input.anonymousVisitorId !== userId) {
                  await this.migrateAnonymousData(
                      input.anonymousVisitorId,
                      userId
                  );
            }

            return {
                  userId: user.id,
                  email: user.email
            };
      }

      private async migrateAnonymousData(
          anonymousVisitorId: string,
          userId: string
      ): Promise<void> {
            const anonHabits = await this.habitRepository.findByVisitorId(
                anonymousVisitorId,
                { includeArchived: true }
            );

            for (const habit of anonHabits) {
                  const migratedHabit = Habit.restore({
                        id: habit.id,
                        visitorId: userId,
                        name: habit.name,
                        color: habit.color,
                        isArchived: habit.isArchived,
                        createdAt: habit.createdAt,
                        orderIndex: habit.orderIndex
                  });

                  await this.habitRepository.save(migratedHabit);
            }

            // 2) Записи времени.
            // Берём "очень широкий" диапазон, чтобы забрать всё, что есть.
            const from = DateOnly.fromString('1970-01-01');
            const to = DateOnly.fromString('9999-12-31');

            const anonEntries =
                await this.timeEntryRepository.findByVisitorAndDateRange({
                      visitorId: anonymousVisitorId,
                      from,
                      to
                });

            for (const entry of anonEntries) {
                  const migratedEntry = TimeEntry.restore({
                        id: entry.id,
                        visitorId: userId,
                        habitId: entry.habitId,
                        date: entry.date,
                        duration: entry.duration,
                        source: entry.source,
                        createdAt: entry.createdAt
                  });

                  await this.timeEntryRepository.save(migratedEntry);
            }
      }
}
