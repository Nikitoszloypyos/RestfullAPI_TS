import { Visitor } from '../../domain/entities/Visitor';

export interface VisitorRepository {
      findById(id: string): Promise<Visitor | null>;
      save(visitor: Visitor): Promise<void>;
}
