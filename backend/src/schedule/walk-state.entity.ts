import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Single-row table (id = 1): rotation anchor.
 * Schedule for date D = walkers[(index(todayWalkerId) + days(D - todayDate)) mod n].
 */
@Entity('walk_state')
export class WalkState {
  @PrimaryColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  todayWalkerId!: number | null;

  @Column({ type: 'varchar', length: 10 })
  todayDate!: string;
}
