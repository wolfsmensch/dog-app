import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('walkers')
export class Walker {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 30 })
  name!: string;

  @Column({ type: 'varchar', length: 7 })
  color!: string;

  /** Order in the rotation queue (0 = first). */
  @Column({ type: 'int' })
  position!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
