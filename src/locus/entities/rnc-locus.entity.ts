import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';

@Entity('rnc_locus')
export class RncLocus {
  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'assembly_id', type: 'text', nullable: true })
  assemblyId: string;

  @Column({ name: 'locus_name', type: 'text', nullable: true })
  locusName: string;

  @Column({ name: 'public_locus_name', type: 'text', nullable: true })
  publicLocusName: string;

  @Column({ type: 'text', nullable: true })
  chromosome: string;

  @Column({ type: 'text', nullable: true })
  strand: string;

  @Column({ name: 'locus_start', type: 'integer', nullable: true })
  locusStart: number;

  @Column({ name: 'locus_stop', type: 'integer', nullable: true })
  locusStop: number;

  @Column({ name: 'member_count', type: 'integer', nullable: true })
  memberCount: number;

  @OneToMany('RncLocusMember', 'locus')
  locusMembers: any[];
}
