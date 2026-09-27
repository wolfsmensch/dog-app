import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Single-row table (id = 1). Neutral seed, no personal data. */
@Entity('pet')
export class Pet {
  @PrimaryColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, default: 'Pet' })
  name!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthDate!: string | null;

  /** Relative path under DATA_DIR/uploads, e.g. 'pet-123.jpg'. Null = no photo. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  photoPath!: string | null;

  @Column({ type: 'varchar', length: 30 })
  updatedAt!: string;
}
