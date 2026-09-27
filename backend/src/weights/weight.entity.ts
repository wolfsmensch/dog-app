import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('weights')
export class Weight {
  @PrimaryGeneratedColumn()
  id!: number;

  /** One record per date (upsert by date). Format 'YYYY-MM-DD'. */
  @Column({ type: 'varchar', length: 10, unique: true })
  date!: string;

  @Column({ type: 'float' })
  kg!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
