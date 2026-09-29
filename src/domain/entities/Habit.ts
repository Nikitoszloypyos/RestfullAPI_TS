import { HabitName } from '../value-objects/HabitName';
import { ValidationError } from '../errors';

export interface HabitProps {
      id: string;
      visitorId: string;
      name: HabitName;
      color?: string;
      isArchived: boolean;
      createdAt: Date;
      orderIndex?: number;
}

export class Habit {

      private props: HabitProps;

      private constructor(props: HabitProps) {
            if (!props.id) {
                  throw new ValidationError('Habit id is required', 'id');
            }
            if (!props.visitorId) {
                  throw new ValidationError('visitorId is required', 'visitorId');
            }
            if (
                props.orderIndex != null &&
                (!Number.isInteger(props.orderIndex) || props.orderIndex < 0)
            ) {
                  throw new ValidationError(
                      'orderIndex must be a non-negative integer',
                      'orderIndex'
                  );
            }

            this.props = { ...props };
      }

      static createNew(params: {
            id: string;
            visitorId: string;
            name: HabitName;
            color?: string;
            createdAt: Date;
            orderIndex?: number;
      }): Habit {
            return new Habit({
                  id: params.id,
                  visitorId: params.visitorId,
                  name: params.name,
                  color: params.color,
                  isArchived: false,
                  createdAt: params.createdAt,
                  orderIndex: params.orderIndex
            });
      }

      static restore(props: HabitProps): Habit {
            return new Habit(props);
      }

      get id(): string {
            return this.props.id;
      }

      get visitorId(): string {
            return this.props.visitorId;
      }

      get name(): HabitName {
            return this.props.name;
      }

      get color(): string | undefined {
            return this.props.color;
      }

      get isArchived(): boolean {
            return this.props.isArchived;
      }

      get createdAt(): Date {
            return this.props.createdAt;
      }

      get orderIndex(): number | undefined {
            return this.props.orderIndex;
      }

      rename(newName: HabitName): void {
            this.props.name = newName;
      }

      changeColor(newColor: string | undefined): void {
            this.props.color = newColor;
      }

      archive(): void {
            this.props.isArchived = true;
      }

      unarchive(): void {
            this.props.isArchived = false;
      }

      setOrderIndex(newIndex: number | undefined): void {
            if (
                newIndex != null &&
                (!Number.isInteger(newIndex) || newIndex < 0)
            ) {
                  throw new ValidationError(
                      'orderIndex must be a non-negative integer',
                      'orderIndex'
                  );
            }
            this.props.orderIndex = newIndex;
      }
}
