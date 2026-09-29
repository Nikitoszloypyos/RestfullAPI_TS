import type { TimeEntryRepository } from '../../ports';
import { AppValidationError, ForbiddenError, NotFoundError } from '../../../domain/errors';
import { type TimeEntryDTO, toTimeEntryDTO } from './TimeEntryDTO';

export interface GetTimeEntryInput {
      ownerId: string;
      timeEntryId: string;
}

export class GetTimeEntryUseCase {
      constructor(private readonly timeEntryRepository: TimeEntryRepository) {}

      async execute(input: GetTimeEntryInput): Promise<TimeEntryDTO> {
            if (!input.ownerId) {
                  throw new AppValidationError('ownerId is required', 'ownerId');
            }
            if (!input.timeEntryId) {
                  throw new AppValidationError('timeEntryId is required', 'timeEntryId');
            }

            const entry = await this.timeEntryRepository.findById(input.timeEntryId);
            if (!entry) {
                  throw new NotFoundError('Time entry not found');
            }
            if (entry.visitorId !== input.ownerId) {
                  throw new ForbiddenError('You do not have permission to view this time entry');
            }

            return toTimeEntryDTO(entry);
      }
}
