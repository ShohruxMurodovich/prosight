import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { RncLocus } from './entities/rnc-locus.entity';
import { LocusQueryDto, SideloadOption } from './dto/locus-query.dto';
import { UserRole } from '../auth/users.data';

const LIMITED_REGION_IDS = [86118093, 86696489, 88186467];

const SORT_FIELDS: Record<string, string> = {
    id: 'rl.id',
    assemblyId: 'rl.assemblyId',
    locusStart: 'rl.locusStart',
    locusStop: 'rl.locusStop',
    memberCount: 'rl.memberCount',
};

@Injectable()
export class LocusService {
    constructor(
        @InjectRepository(RncLocus)
        private readonly locusRepo: Repository<RncLocus>,
    ) { }

    async getLocus(dto: LocusQueryDto, role: UserRole) {
        if (role === UserRole.NORMAL && dto.include === SideloadOption.LOCUS_MEMBERS) {
            throw new ForbiddenException('Sideloading is not available for your role');
        }

        const qb = this.locusRepo.createQueryBuilder('rl');
        this.applyJoins(qb, dto, role);
        this.applyFilters(qb, dto, role);
        this.applySortAndPagination(qb, dto);

        const [data, total] = await qb.getManyAndCount();

        if (dto.include !== SideloadOption.LOCUS_MEMBERS) {
            data.forEach((row) => {
                delete (row as any).locusMembers;
            });
        }

        const limit = Math.min(dto.limit ?? 1000, 1000);
        return { data, total, page: dto.page ?? 1, limit };
    }

    private needsMemberJoin(dto: LocusQueryDto, role: UserRole): boolean {
        return (
            role === UserRole.LIMITED ||
            dto.include === SideloadOption.LOCUS_MEMBERS ||
            !!dto.membershipStatus ||
            (Array.isArray(dto.regionId) && dto.regionId.length > 0)
        );
    }

    private applyJoins(qb: SelectQueryBuilder<RncLocus>, dto: LocusQueryDto, role: UserRole) {
        if (!this.needsMemberJoin(dto, role)) return;

        if (dto.include === SideloadOption.LOCUS_MEMBERS && role === UserRole.ADMIN) {
            qb.leftJoinAndSelect('rl.locusMembers', 'rlm');
        } else {
            qb.leftJoin('rl.locusMembers', 'rlm');
        }
    }

    private applyFilters(qb: SelectQueryBuilder<RncLocus>, dto: LocusQueryDto, role: UserRole) {
        if (Array.isArray(dto.id) && dto.id.length > 0) {
            qb.andWhere('rl.id IN (:...ids)', { ids: dto.id });
        }

        if (dto.assemblyId) {
            qb.andWhere('rl.assemblyId = :assemblyId', { assemblyId: dto.assemblyId });
        }

        if (Array.isArray(dto.regionId) && dto.regionId.length > 0) {
            qb.andWhere('rlm.regionId IN (:...regionIds)', { regionIds: dto.regionId });
        }

        if (dto.membershipStatus) {
            qb.andWhere('rlm.membershipStatus = :membershipStatus', {
                membershipStatus: dto.membershipStatus,
            });
        }

        if (role === UserRole.LIMITED) {
            qb.andWhere('rlm.regionId IN (:...allowed)', { allowed: LIMITED_REGION_IDS });
        }

        if (this.needsMemberJoin(dto, role) && dto.include !== SideloadOption.LOCUS_MEMBERS) {
            qb.groupBy('rl.id');
        }
    }

    private applySortAndPagination(qb: SelectQueryBuilder<RncLocus>, dto: LocusQueryDto) {
        const field = SORT_FIELDS[dto.sortBy ?? 'id'] ?? 'rl.id';
        const order = (dto.sortOrder ?? 'ASC') as 'ASC' | 'DESC';
        qb.orderBy(field, order);

        const limit = Math.min(dto.limit ?? 1000, 1000);
        const offset = ((dto.page ?? 1) - 1) * limit;
        qb.skip(offset).take(limit);
    }
}
