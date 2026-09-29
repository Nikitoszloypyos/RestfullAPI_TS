import { ValidationError } from '../errors';

export interface VisitorProps {
      id: string;
      createdAt: Date;
      lastVisitAt: Date;
      visitCount: number;
}

export class Visitor {
      private props: VisitorProps;

      private constructor(props: VisitorProps) {
            if (!props.id) {
                  throw new ValidationError('Visitor id is required', 'id');
            }
            if (props.visitCount < 1) {
                  throw new ValidationError(
                      'visitCount must be greater or equal to 1',
                      'visitCount'
                  );
            }
            if (props.lastVisitAt < props.createdAt) {
                  throw new ValidationError(
                      'lastVisitAt cannot be before createdAt',
                      'lastVisitAt'
                  );
            }

            this.props = { ...props };
      }

      static createNew(id: string, now: Date): Visitor {
            return new Visitor({
                  id,
                  createdAt: now,
                  lastVisitAt: now,
                  visitCount: 1
            });
      }

      static restore(props: VisitorProps): Visitor {
            return new Visitor(props);
      }

      get id(): string {
            return this.props.id;
      }

      get createdAt(): Date {
            return this.props.createdAt;
      }

      get lastVisitAt(): Date {
            return this.props.lastVisitAt;
      }

      get visitCount(): number {
            return this.props.visitCount;
      }

      registerVisit(now: Date): void {
            if (now < this.props.createdAt) {
                  throw new ValidationError(
                      'Visit date cannot be before createdAt',
                      'visitDate'
                  );
            }

            this.props.lastVisitAt = now;
            this.props.visitCount += 1;
      }
}
