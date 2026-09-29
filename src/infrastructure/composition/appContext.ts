import type { Clock } from '../../application/ports';
import type { IdGenerator } from '../../application/ports';
import type { PasswordHasher } from '../../application/ports';

import type { VisitorRepository } from '../../application/ports';
import type { HabitRepository } from '../../application/ports';
import type { TimeEntryRepository } from '../../application/ports';
import type { UserRepository } from '../../application/ports';

import { DbVisitorRepository } from '../repos/DbVisitorRepository';
import { DbHabitRepository } from '../repos/DbHabitRepository';
import { DbTimeEntryRepository } from '../repos/DbTimeEntryRepository';
import { DbUserRepository } from '../repos/DbUserRepository';

import { SystemClock } from '../../shared/SystemClock';
import { UuidIdGenerator } from '../../shared/UuidIdGenerator';
import { BcryptPasswordHasher } from '../../shared/BcryptPasswordHasher';

// use-cases
import { RegisterVisitUseCase } from '../../application/use-cases/session/RegisterVisitUseCase';
import { RegisterWithMailRuUseCase } from '../../application/use-cases/auth/RegisterWithMailRuUseCase';
import { LoginWithMailRuUseCase } from '../../application/use-cases/auth/LoginWithMailRuUseCase';

import { CreateHabitUseCase } from '../../application/use-cases/habits/CreateHabitUseCase';
import { ListHabitsUseCase } from '../../application/use-cases/habits/ListHabitsUseCase';
import { RenameHabitUseCase } from '../../application/use-cases/habits/RenameHabitUseCase';
import { ArchiveHabitUseCase } from '../../application/use-cases/habits/ArchiveHabitUseCase';
import { GetHabitUseCase } from '../../application/use-cases/habits/GetHabitUseCase';
import { UpdateHabitUseCase } from '../../application/use-cases/habits/UpdateHabitUseCase';
import { DeleteHabitUseCase } from '../../application/use-cases/habits/DeleteHabitUseCase';

import { AddTimeEntryUseCase } from '../../application/use-cases/time-entries/AddTimeEntryUseCase';
import { ListTimeEntriesForPeriodUseCase } from '../../application/use-cases/time-entries/ListTimeEntriesForPeriodUseCase';
import { GetTimeEntryUseCase } from '../../application/use-cases/time-entries/GetTimeEntryUseCase';
import { ListTimeEntriesUseCase } from '../../application/use-cases/time-entries/ListTimeEntriesUseCase';
import { UpdateTimeEntryUseCase } from '../../application/use-cases/time-entries/UpdateTimeEntryUseCase';
import { DeleteTimeEntryUseCase } from '../../application/use-cases/time-entries/DeleteTimeEntryUseCase';

import { GetStatsSummaryUseCase } from '../../application/use-cases/GetStatsSummaryUseCase';


export interface AppContext {
      clock: Clock;
      idGenerator: IdGenerator;
      passwordHasher: PasswordHasher;

      userRepository: UserRepository;
      visitorRepository: VisitorRepository;
      habitRepository: HabitRepository;
      timeEntryRepository: TimeEntryRepository;

      registerVisitUseCase: RegisterVisitUseCase;

      registerWithMailRuUseCase: RegisterWithMailRuUseCase;
      loginWithMailRuUseCase: LoginWithMailRuUseCase;

      createHabitUseCase: CreateHabitUseCase;
      listHabitsUseCase: ListHabitsUseCase;
      renameHabitUseCase: RenameHabitUseCase;
      archiveHabitUseCase: ArchiveHabitUseCase;
      getHabitUseCase: GetHabitUseCase;
      updateHabitUseCase: UpdateHabitUseCase;
      deleteHabitUseCase: DeleteHabitUseCase;

      addTimeEntryUseCase: AddTimeEntryUseCase;
      listTimeEntriesForPeriodUseCase: ListTimeEntriesForPeriodUseCase;
      getTimeEntryUseCase: GetTimeEntryUseCase;
      listTimeEntriesUseCase: ListTimeEntriesUseCase;
      updateTimeEntryUseCase: UpdateTimeEntryUseCase;
      deleteTimeEntryUseCase: DeleteTimeEntryUseCase;

      getStatsSummaryUseCase: GetStatsSummaryUseCase;
}

export function createAppContext(): AppContext {
      const clock: Clock = new SystemClock();
      const idGenerator: IdGenerator = new UuidIdGenerator();
      const passwordHasher: PasswordHasher = new BcryptPasswordHasher(10);

      const userRepository: UserRepository = new DbUserRepository();
      const visitorRepository: VisitorRepository = new DbVisitorRepository();
      const habitRepository: HabitRepository = new DbHabitRepository();
      const timeEntryRepository: TimeEntryRepository = new DbTimeEntryRepository();

      const registerVisitUseCase = new RegisterVisitUseCase(
          visitorRepository,
          clock,
          idGenerator
      );

      const registerWithMailRuUseCase = new RegisterWithMailRuUseCase(
          userRepository,
          habitRepository,
          timeEntryRepository,
          passwordHasher,
          idGenerator,
          clock
      );

      const loginWithMailRuUseCase = new LoginWithMailRuUseCase(
          userRepository,
          passwordHasher
      );

      const createHabitUseCase = new CreateHabitUseCase(
          habitRepository,
          clock,
          idGenerator
      );

      const listHabitsUseCase = new ListHabitsUseCase(habitRepository);
      const renameHabitUseCase = new RenameHabitUseCase(habitRepository);
      const archiveHabitUseCase = new ArchiveHabitUseCase(habitRepository);
      const getHabitUseCase = new GetHabitUseCase(habitRepository);
      const updateHabitUseCase = new UpdateHabitUseCase(habitRepository);
      const deleteHabitUseCase = new DeleteHabitUseCase(habitRepository);

      const addTimeEntryUseCase = new AddTimeEntryUseCase(
          timeEntryRepository,
          habitRepository,
          clock,
          idGenerator
      );
      const listTimeEntriesForPeriodUseCase =  new ListTimeEntriesForPeriodUseCase(timeEntryRepository);
      const getTimeEntryUseCase = new GetTimeEntryUseCase(timeEntryRepository);
      const listTimeEntriesUseCase = new ListTimeEntriesUseCase(timeEntryRepository);
      const updateTimeEntryUseCase = new UpdateTimeEntryUseCase(
          timeEntryRepository,
          habitRepository
      );
      const deleteTimeEntryUseCase = new DeleteTimeEntryUseCase(timeEntryRepository);

      const getStatsSummaryUseCase = new GetStatsSummaryUseCase(
          habitRepository,
          timeEntryRepository
      );

      return {
            clock,
            idGenerator,
            passwordHasher,
            userRepository,
            visitorRepository,
            habitRepository,
            timeEntryRepository,
            registerVisitUseCase,
            registerWithMailRuUseCase,
            loginWithMailRuUseCase,
            createHabitUseCase,
            listHabitsUseCase,
            renameHabitUseCase,
            archiveHabitUseCase,
            getHabitUseCase,
            updateHabitUseCase,
            deleteHabitUseCase,
            addTimeEntryUseCase,
            listTimeEntriesForPeriodUseCase,
            getTimeEntryUseCase,
            listTimeEntriesUseCase,
            updateTimeEntryUseCase,
            deleteTimeEntryUseCase,
            getStatsSummaryUseCase
      };
}
