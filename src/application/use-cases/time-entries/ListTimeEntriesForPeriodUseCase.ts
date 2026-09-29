import type { TimeEntryRepository } from '../../ports';
import { DateOnly } from '../../../domain/value-objects/DateOnly';
import { AppValidationError } from '../../../domain/errors';
import { TimeEntryDTO, toTimeEntryDTO } from './TimeEntryDTO';

export interface ListTimeEntriesForPeriodInput {
      ownerId: string;
      from: string; // YYYY-MM-DD
      to: string;   // YYYY-MM-DD
}

export type ListTimeEntriesForPeriodOutput = TimeEntryDTO[];


 // Возвращает записи времени за период.

export class ListTimeEntriesForPeriodUseCase {
      constructor(
          private readonly timeEntryRepository: TimeEntryRepository
      ) {}

      async execute(
          input: ListTimeEntriesForPeriodInput
      ): Promise<ListTimeEntriesForPeriodOutput> {
            const { ownerId, from, to } = input;

            if (!ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!from) {
                  throw new AppValidationError('from is required', 'from');
            }
            if (!to) {
                  throw new AppValidationError('to is required', 'to');
            }

            const fromDate = DateOnly.fromString(from);
            const toDate = DateOnly.fromString(to);

            if (fromDate.isAfter(toDate)) {
                  throw new AppValidationError(
                      '`from` cannot be after `to`',
                      'from'
                  );
            }

            const entries =
                await this.timeEntryRepository.findByVisitorAndDateRange({
                      visitorId: ownerId,
                      from: fromDate,
                      to: toDate
                });

            entries.sort((a, b) => {
                  const cmp = a.date.compare(b.date);
                  if (cmp !== 0) return cmp;
                  return a.createdAt.getTime() - b.createdAt.getTime();
            });

            return entries.map(toTimeEntryDTO);
      }
}
