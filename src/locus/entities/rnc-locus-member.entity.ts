import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RncLocus } from './rnc-locus.entity';

@Entity('rnc_locus_members')
export class RncLocusMember {
    @PrimaryColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'urs_taxid', type: 'text', nullable: true })
    ursTaxid: string;

    @Column({ name: 'region_id', type: 'integer', nullable: true })
    regionId: number;

    @Column({ name: 'locus_id', type: 'bigint', nullable: true })
    locusId: number;

    @Column({ name: 'membership_status', type: 'text', nullable: true })
    membershipStatus: string;

    @ManyToOne(() => RncLocus, (locus) => locus.locusMembers)
    @JoinColumn({ name: 'locus_id' })
    locus: RncLocus;
}
