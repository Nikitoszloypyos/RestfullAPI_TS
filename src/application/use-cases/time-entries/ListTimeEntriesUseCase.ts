import type { TimeEntryRepository } from '../../ports';
import { AppValidationError } from '../../../domain/errors';
import { type TimeEntryDTO, toTimeEntryDTO } from './TimeEntryDTO';

export class ListTimeEntriesUseCase {
      constructor(private readonly timeEntryRepository: TimeEntryRepository) {}

      async execute(input: { ownerId: string }): Promise<TimeEntryDTO[]> {
            if (!input.ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }

            const entries = await this.timeEntryRepository.findByVisitorId(input.ownerId);
            entries.sort((a, b) => {
                  const dateComparison = a.date.compare(b.date);
                  return dateComparison || a.createdAt.getTime() - b.createdAt.getTime();
            });

            return entries.map(toTimeEntryDTO);
      }
}
