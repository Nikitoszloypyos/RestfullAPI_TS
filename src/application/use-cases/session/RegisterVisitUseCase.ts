import { Visitor } from '../../../domain/entities/Visitor';
import type { VisitorRepository } from '../../ports';
import type { Clock, IdGenerator } from '../../ports';


export interface RegisterVisitInput {
      anonymousVisitorId?: string | null;
      userId?: string | null;
}

export interface RegisterVisitOutput {
      ownerId: string;
      visitCount: number;
      createdAt: string;   // ISO
      lastVisitAt: string; // ISO
}

export class RegisterVisitUseCase {
      constructor(
          private readonly visitorRepository: VisitorRepository,
          private readonly clock: Clock,
          private readonly idGenerator: IdGenerator
      ) {}

      async execute(input: RegisterVisitInput): Promise<RegisterVisitOutput> {
            const now = this.clock.now();

            let ownerId: string;

            if (input.userId) {
                  ownerId = input.userId;
            } else if (input.anonymousVisitorId) {
                  ownerId = input.anonymousVisitorId;
            } else {
                  ownerId = this.idGenerator.generate();
            }

            let visitor = await this.visitorRepository.findById(ownerId);

            if (!visitor) {
                  visitor = Visitor.createNew(ownerId, now);
            } else {
                  visitor.registerVisit(now);
            }

            await this.visitorRepository.save(visitor);

            return {
                  ownerId,
                  visitCount: visitor.visitCount,
                  createdAt: visitor.createdAt.toISOString(),
                  lastVisitAt: visitor.lastVisitAt.toISOString()
            };
      }
}
