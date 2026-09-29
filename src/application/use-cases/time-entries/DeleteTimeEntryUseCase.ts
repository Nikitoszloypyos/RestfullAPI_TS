import type { TimeEntryRepository } from '../../ports';
import { AppValidationError, ForbiddenError, NotFoundError } from '../../../domain/errors';

export interface DeleteTimeEntryInput {
      ownerId: string;
      timeEntryId: string;
}

export class DeleteTimeEntryUseCase {
      constructor(private readonly timeEntryRepository: TimeEntryRepository) {}

      async execute(input: DeleteTimeEntryInput): Promise<void> {
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
                  throw new ForbiddenError('You do not have permission to delete this time entry');
            }

            await this.timeEntryRepository.delete(input.timeEntryId);
      }
}
