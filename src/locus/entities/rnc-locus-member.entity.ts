import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RncLocus } from './rnc-locus.entity';

@Entity('rnc_locus_members')
export class RncLocusMember {
    @PrimaryColumn({ name: 'locus_member_id', type: 'int' })
    locusMemberId: number;

    @Column({ name: 'region_id', type: 'bigint', nullable: true })
    regionId: number;

    @Column({ name: 'locus_id', type: 'int', nullable: true })
    locusId: number;

    @Column({ name: 'membership_status', type: 'varchar', nullable: true })
    membershipStatus: string;

    @Column({ name: 'urs_taxid', type: 'varchar', nullable: true })
    ursTaxid: string;

    @ManyToOne(() => RncLocus, (locus) => locus.locusMembers)
    @JoinColumn({ name: 'locus_id' })
    locus: RncLocus;
}
