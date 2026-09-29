import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { FastifyInstance } from 'fastify';

import type {
      HabitRepository,
      HabitRepositoryFindOptions,
      TimeEntriesByPeriodParams,
      TimeEntryRepository
} from '../src/application/ports';
import { ArchiveHabitUseCase } from '../src/application/use-cases/habits/ArchiveHabitUseCase';
import { CreateHabitUseCase } from '../src/application/use-cases/habits/CreateHabitUseCase';
import { DeleteHabitUseCase } from '../src/application/use-cases/habits/DeleteHabitUseCase';
import { GetHabitUseCase } from '../src/application/use-cases/habits/GetHabitUseCase';
import { ListHabitsUseCase } from '../src/application/use-cases/habits/ListHabitsUseCase';
import { RenameHabitUseCase } from '../src/application/use-cases/habits/RenameHabitUseCase';
import { UpdateHabitUseCase } from '../src/application/use-cases/habits/UpdateHabitUseCase';
import { AddTimeEntryUseCase } from '../src/application/use-cases/time-entries/AddTimeEntryUseCase';
import { DeleteTimeEntryUseCase } from '../src/application/use-cases/time-entries/DeleteTimeEntryUseCase';
import { GetTimeEntryUseCase } from '../src/application/use-cases/time-entries/GetTimeEntryUseCase';
import { ListTimeEntriesForPeriodUseCase } from '../src/application/use-cases/time-entries/ListTimeEntriesForPeriodUseCase';
import { ListTimeEntriesUseCase } from '../src/application/use-cases/time-entries/ListTimeEntriesUseCase';
import { UpdateTimeEntryUseCase } from '../src/application/use-cases/time-entries/UpdateTimeEntryUseCase';
import { Habit } from '../src/domain/entities/Habit';
import { TimeEntry } from '../src/domain/entities/TimeEntry';
import { createServer } from '../src/infrastructure/HTTP/createServer';
import type { AppContext } from '../src/infrastructure/composition/appContext';

const OWNER_ID = 'owner-1';
const OTHER_OWNER_ID = 'owner-2';
const ownerHeaders = { 'x-owner-id': OWNER_ID };

class InMemoryHabitRepository implements HabitRepository {
      private readonly records = new Map<string, Habit>();

      async findById(id: string): Promise<Habit | null> {
            return this.records.get(id) ?? null;
      }

      async findByVisitorId(
          visitorId: string,
          options?: HabitRepositoryFindOptions
      ): Promise<Habit[]> {
            return [...this.records.values()].filter(
                (habit) =>
                    habit.visitorId === visitorId &&
                    (options?.includeArchived || !habit.isArchived)
            );
      }

      async save(habit: Habit): Promise<void> {
            this.records.set(habit.id, habit);
      }

      async delete(id: string): Promise<void> {
            this.records.delete(id);
      }
}

class InMemoryTimeEntryRepository implements TimeEntryRepository {
      private readonly records = new Map<string, TimeEntry>();

      async findById(id: string): Promise<TimeEntry | null> {
            return this.records.get(id) ?? null;
      }

      async findByVisitorId(visitorId: string): Promise<TimeEntry[]> {
            return [...this.records.values()].filter(
                (entry) => entry.visitorId === visitorId
            );
      }

      async findByVisitorAndDateRange(
          params: TimeEntriesByPeriodParams
      ): Promise<TimeEntry[]> {
            return [...this.records.values()].filter(
                (entry) =>
                    entry.visitorId === params.visitorId &&
                    entry.date.isBetweenInclusive(params.from, params.to)
            );
      }

      async save(entry: TimeEntry): Promise<void> {
            this.records.set(entry.id, entry);
      }

      async delete(id: string): Promise<void> {
            this.records.delete(id);
      }
}

function createTestContext(): AppContext {
      const habitRepository = new InMemoryHabitRepository();
      const timeEntryRepository = new InMemoryTimeEntryRepository();
      let nextId = 1;
      const clock = { now: () => new Date('2026-01-15T12:00:00.000Z') };
      const idGenerator = { generate: () => `test-id-${nextId++}` };

      return {
            clock,
            idGenerator,
            passwordHasher: {} as AppContext['passwordHasher'],
            userRepository: {} as AppContext['userRepository'],
            visitorRepository: {} as AppContext['visitorRepository'],
            habitRepository,
            timeEntryRepository,
            registerVisitUseCase: {} as AppContext['registerVisitUseCase'],
            registerWithMailRuUseCase: {} as AppContext['registerWithMailRuUseCase'],
            loginWithMailRuUseCase: {} as AppContext['loginWithMailRuUseCase'],
            createHabitUseCase: new CreateHabitUseCase(
                habitRepository,
                clock,
                idGenerator
            ),
            listHabitsUseCase: new ListHabitsUseCase(habitRepository),
            renameHabitUseCase: new RenameHabitUseCase(habitRepository),
            archiveHabitUseCase: new ArchiveHabitUseCase(habitRepository),
            getHabitUseCase: new GetHabitUseCase(habitRepository),
            updateHabitUseCase: new UpdateHabitUseCase(habitRepository),
            deleteHabitUseCase: new DeleteHabitUseCase(habitRepository),
            addTimeEntryUseCase: new AddTimeEntryUseCase(
                timeEntryRepository,
                habitRepository,
                clock,
                idGenerator
            ),
            listTimeEntriesForPeriodUseCase: new ListTimeEntriesForPeriodUseCase(
                timeEntryRepository
            ),
            getTimeEntryUseCase: new GetTimeEntryUseCase(timeEntryRepository),
            listTimeEntriesUseCase: new ListTimeEntriesUseCase(timeEntryRepository),
            updateTimeEntryUseCase: new UpdateTimeEntryUseCase(
                timeEntryRepository,
                habitRepository
            ),
            deleteTimeEntryUseCase: new DeleteTimeEntryUseCase(timeEntryRepository),
            getStatsSummaryUseCase: {} as AppContext['getStatsSummaryUseCase']
      };
}

async function createHabit(
    app: FastifyInstance,
    name = 'Read documentation'
): Promise<Record<string, unknown>> {
      const response = await app.inject({
            method: 'POST',
            url: '/api/habits',
            headers: ownerHeaders,
            payload: { name, color: '#336699', orderIndex: 0 }
      });
      assert.equal(response.statusCode, 200);
      return response.json().habit;
}

describe('REST API', () => {
      let app: FastifyInstance;

      before(async () => {
            app = createServer(createTestContext(), { logger: false });
            await app.ready();
      });

      after(async () => {
            await app.close();
      });

      it('supports the complete Habit CRUD flow', async () => {
            const created = await createHabit(app);
            const id = created.id as string;

            const listResponse = await app.inject({
                  method: 'GET',
                  url: '/api/habits',
                  headers: ownerHeaders
            });
            assert.equal(listResponse.statusCode, 200);
            assert.equal(listResponse.json().list.length, 1);

            const getResponse = await app.inject({
                  method: 'GET',
                  url: `/api/habits/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(getResponse.statusCode, 200);
            assert.equal(getResponse.json().habit.name, 'Read documentation');

            const patchResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/habits/${id}`,
                  headers: ownerHeaders,
                  payload: {
                        name: 'Write tests',
                        color: null,
                        orderIndex: 2,
                        isArchived: true
                  }
            });
            assert.equal(patchResponse.statusCode, 200);
            assert.equal(patchResponse.json().habit.name, 'Write tests');
            assert.equal(patchResponse.json().habit.isArchived, true);
            assert.equal(patchResponse.json().habit.color, undefined);

            const deleteResponse = await app.inject({
                  method: 'DELETE',
                  url: `/api/habits/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(deleteResponse.statusCode, 202);

            const missingResponse = await app.inject({
                  method: 'GET',
                  url: `/api/habits/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(missingResponse.statusCode, 404);
            assert.deepEqual(missingResponse.json(), {
                  status: 404,
                  reason: 'Habit not found'
            });

            const missingPatchResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/habits/${id}`,
                  headers: ownerHeaders,
                  payload: { name: 'Still missing' }
            });
            assert.equal(missingPatchResponse.statusCode, 404);

            const missingDeleteResponse = await app.inject({
                  method: 'DELETE',
                  url: `/api/habits/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(missingDeleteResponse.statusCode, 404);
      });

      it('supports the complete TimeEntry CRUD flow', async () => {
            const habit = await createHabit(app, 'Exercise');
            const createResponse = await app.inject({
                  method: 'POST',
                  url: '/api/time-entries',
                  headers: ownerHeaders,
                  payload: {
                        habitId: habit.id,
                        date: '2026-01-10',
                        durationMinutes: 30,
                        source: 'manual'
                  }
            });
            assert.equal(createResponse.statusCode, 200);
            const id = createResponse.json().timeEntry.id as string;

            const getResponse = await app.inject({
                  method: 'GET',
                  url: `/api/time-entries/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(getResponse.statusCode, 200);
            assert.equal(getResponse.json().timeEntry.durationMinutes, 30);

            const listResponse = await app.inject({
                  method: 'GET',
                  url: '/api/time-entries',
                  headers: ownerHeaders
            });
            assert.equal(listResponse.statusCode, 200);
            assert.equal(listResponse.json().list.length, 1);

            const patchResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/time-entries/${id}`,
                  headers: ownerHeaders,
                  payload: {
                        date: '2026-01-11',
                        durationMinutes: 45,
                        source: null
                  }
            });
            assert.equal(patchResponse.statusCode, 200);
            assert.equal(patchResponse.json().timeEntry.date, '2026-01-11');
            assert.equal(patchResponse.json().timeEntry.durationMinutes, 45);
            assert.equal(patchResponse.json().timeEntry.source, undefined);

            const deleteResponse = await app.inject({
                  method: 'DELETE',
                  url: `/api/time-entries/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(deleteResponse.statusCode, 202);

            const missingResponse = await app.inject({
                  method: 'GET',
                  url: `/api/time-entries/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(missingResponse.statusCode, 404);

            const missingPatchResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/time-entries/${id}`,
                  headers: ownerHeaders,
                  payload: { durationMinutes: 10 }
            });
            assert.equal(missingPatchResponse.statusCode, 404);

            const missingDeleteResponse = await app.inject({
                  method: 'DELETE',
                  url: `/api/time-entries/${id}`,
                  headers: ownerHeaders
            });
            assert.equal(missingDeleteResponse.statusCode, 404);
      });

      it('validates request bodies and domain values as HTTP 400', async () => {
            const missingName = await app.inject({
                  method: 'POST',
                  url: '/api/habits',
                  headers: ownerHeaders,
                  payload: {}
            });
            assert.equal(missingName.statusCode, 400);
            assert.equal(missingName.json().status, 400);
            assert.equal(typeof missingName.json().reason, 'string');

            const habit = await createHabit(app, 'Validation target');
            const invalidDate = await app.inject({
                  method: 'POST',
                  url: '/api/time-entries',
                  headers: ownerHeaders,
                  payload: {
                        habitId: habit.id,
                        date: '2026-99-99',
                        durationMinutes: 15
                  }
            });
            assert.equal(invalidDate.statusCode, 400);
            assert.deepEqual(invalidDate.json(), {
                  status: 400,
                  reason: 'DateOnly must be a valid date'
            });

            const invalidDuration = await app.inject({
                  method: 'POST',
                  url: '/api/time-entries',
                  headers: ownerHeaders,
                  payload: {
                        habitId: habit.id,
                        date: '2026-01-10',
                        durationMinutes: 0
                  }
            });
            assert.equal(invalidDuration.statusCode, 400);
            assert.equal(invalidDuration.json().status, 400);
      });

      it('returns 403 when an object belongs to another owner', async () => {
            const habit = await createHabit(app, 'Private habit');
            const response = await app.inject({
                  method: 'GET',
                  url: `/api/habits/${habit.id}`,
                  headers: { 'x-owner-id': OTHER_OWNER_ID }
            });

            assert.equal(response.statusCode, 403);
            assert.equal(response.json().status, 403);
      });

      it('supports date-range filtering and validates incomplete ranges', async () => {
            const habit = await createHabit(app, 'Filter target');
            for (const date of ['2026-01-05', '2026-02-05']) {
                  const response = await app.inject({
                        method: 'POST',
                        url: '/api/time-entries',
                        headers: ownerHeaders,
                        payload: {
                              habitId: habit.id,
                              date,
                              durationMinutes: 10
                        }
                  });
                  assert.equal(response.statusCode, 200);
            }

            const filteredResponse = await app.inject({
                  method: 'GET',
                  url: '/api/time-entries?from=2026-01-01&to=2026-01-31',
                  headers: ownerHeaders
            });
            assert.equal(filteredResponse.statusCode, 200);
            assert.equal(filteredResponse.json().list.length, 1);

            const incompleteRangeResponse = await app.inject({
                  method: 'GET',
                  url: '/api/time-entries?from=2026-01-01',
                  headers: ownerHeaders
            });
            assert.equal(incompleteRangeResponse.statusCode, 400);
            assert.deepEqual(incompleteRangeResponse.json(), {
                  status: 400,
                  reason: 'from and to must be provided together'
            });
      });

      it('requires an owner identifier', async () => {
            const response = await app.inject({
                  method: 'GET',
                  url: '/api/habits'
            });

            assert.equal(response.statusCode, 400);
            assert.deepEqual(response.json(), {
                  status: 400,
                  reason: 'ownerId is required'
            });
      });

      it('filters archived habits unless they are explicitly requested', async () => {
            const habit = await createHabit(app, 'Archived habit');
            const archiveResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/habits/${habit.id}`,
                  headers: ownerHeaders,
                  payload: { isArchived: true }
            });
            assert.equal(archiveResponse.statusCode, 200);

            const activeResponse = await app.inject({
                  method: 'GET',
                  url: '/api/habits',
                  headers: ownerHeaders
            });
            assert.equal(activeResponse.statusCode, 200);
            assert.equal(
                activeResponse.json().list.some(
                    (item: { id: string }) => item.id === habit.id
                ),
                false
            );

            const allResponse = await app.inject({
                  method: 'GET',
                  url: '/api/habits?includeArchived=true',
                  headers: ownerHeaders
            });
            assert.equal(allResponse.statusCode, 200);
            assert.equal(
                allResponse.json().list.some(
                    (item: { id: string }) => item.id === habit.id
                ),
                true
            );
      });

      it('moves a time entry only to a habit owned by the same owner', async () => {
            const firstHabit = await createHabit(app, 'First habit');
            const secondHabit = await createHabit(app, 'Second habit');
            const foreignHabitResponse = await app.inject({
                  method: 'POST',
                  url: '/api/habits',
                  headers: { 'x-owner-id': OTHER_OWNER_ID },
                  payload: { name: 'Foreign habit' }
            });
            assert.equal(foreignHabitResponse.statusCode, 200);
            const foreignHabit = foreignHabitResponse.json().habit;

            const createResponse = await app.inject({
                  method: 'POST',
                  url: '/api/time-entries',
                  headers: ownerHeaders,
                  payload: {
                        habitId: firstHabit.id,
                        date: '2026-03-01',
                        durationMinutes: 20
                  }
            });
            assert.equal(createResponse.statusCode, 200);
            const timeEntryId = createResponse.json().timeEntry.id;

            const moveResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/time-entries/${timeEntryId}`,
                  headers: ownerHeaders,
                  payload: { habitId: secondHabit.id }
            });
            assert.equal(moveResponse.statusCode, 200);
            assert.equal(moveResponse.json().timeEntry.habitId, secondHabit.id);

            const forbiddenResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/time-entries/${timeEntryId}`,
                  headers: ownerHeaders,
                  payload: { habitId: foreignHabit.id }
            });
            assert.equal(forbiddenResponse.statusCode, 403);
            assert.equal(forbiddenResponse.json().status, 403);
      });

      it('rejects empty PATCH requests for both resources', async () => {
            const habit = await createHabit(app, 'Patch target');
            const habitResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/habits/${habit.id}`,
                  headers: ownerHeaders,
                  payload: {}
            });
            assert.equal(habitResponse.statusCode, 400);
            assert.equal(habitResponse.json().status, 400);

            const createResponse = await app.inject({
                  method: 'POST',
                  url: '/api/time-entries',
                  headers: ownerHeaders,
                  payload: {
                        habitId: habit.id,
                        date: '2026-04-01',
                        durationMinutes: 25
                  }
            });
            assert.equal(createResponse.statusCode, 200);

            const timeEntryResponse = await app.inject({
                  method: 'PATCH',
                  url: `/api/time-entries/${createResponse.json().timeEntry.id}`,
                  headers: ownerHeaders,
                  payload: {}
            });
            assert.equal(timeEntryResponse.statusCode, 400);
            assert.equal(timeEntryResponse.json().status, 400);
      });

      it('returns the required response shape for unexpected errors', async () => {
            const context = createTestContext();
            context.listHabitsUseCase.execute = async () => {
                  throw new Error('Database is unavailable');
            };
            const failingApp = createServer(context, { logger: false });

            try {
                  const response = await failingApp.inject({
                        method: 'GET',
                        url: '/api/habits',
                        headers: ownerHeaders
                  });

                  assert.equal(response.statusCode, 500);
                  assert.deepEqual(response.json(), {
                        status: 500,
                        reason: 'Internal server error'
                  });
            } finally {
                  await failingApp.close();
            }
      });
});
