import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { RncLocusMember } from './rnc-locus-member.entity';

@Entity('rnc_locus')
export class RncLocus {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ name: 'assembly_id', type: 'varchar', nullable: true })
  assemblyId: string;

  @Column({ name: 'locus_name', type: 'text', nullable: true })
  locusName: string;

  @Column({ name: 'public_locus_name', type: 'varchar', nullable: true })
  publicLocusName: string;

  @Column({ type: 'varchar', nullable: true })
  chromosome: string;

  @Column({ type: 'varchar', nullable: true })
  strand: string;

  @Column({ name: 'locus_start', type: 'bigint', nullable: true })
  locusStart: number;

  @Column({ name: 'locus_stop', type: 'bigint', nullable: true })
  locusStop: number;

  @Column({ name: 'member_count', type: 'int', nullable: true })
  memberCount: number;

  @OneToMany(() => RncLocusMember, (member) => member.locus)
  locusMembers: RncLocusMember[];
}
