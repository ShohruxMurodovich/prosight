import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RncLocus } from './entities/rnc-locus.entity';
import { LocusQueryDto, SideloadOption } from './dto/locus-query.dto';
import { UserRole } from '../auth/users.data';

const LIMITED_REGION_IDS = [86118093, 86696489, 88186467];

@Injectable()
export class LocusService {
    constructor(
        @InjectRepository(RncLocus)
        private readonly locusRepository: Repository<RncLocus>,
    ) { }

    async getLocus(
        query: LocusQueryDto,
        userRole: UserRole,
    ): Promise<{ data: RncLocus[]; total: number; page: number; limit: number }> {
        const {
            id,
            assemblyId,
            regionId,
            membershipStatus,
            include,
            page = 1,
            limit = 1000,
            sortBy = 'id',
            sortOrder = 'ASC',
        } = query;

        // normal user cannot use sideloading
        if (
            userRole === UserRole.NORMAL &&
            include === SideloadOption.LOCUS_MEMBERS
        ) {
            throw new ForbiddenException(
                'Normal users are not allowed to use sideloading',
            );
        }

        const qb = this.locusRepository.createQueryBuilder('rl');

        // Determine if we need to join rnc_locus_members
        const hasRegionFilter = Array.isArray(regionId) && regionId.length > 0;
        const needsMemberJoin =
            hasRegionFilter ||
            !!membershipStatus ||
            include === SideloadOption.LOCUS_MEMBERS ||
            userRole === UserRole.LIMITED;

        if (needsMemberJoin) {
            if (
                include === SideloadOption.LOCUS_MEMBERS &&
                userRole === UserRole.ADMIN
            ) {
                // Left join and select member data for sideloading (admin only)
                qb.leftJoinAndSelect('rl.locusMembers', 'rlm');
            } else {
                // Left join for filtering purposes only (no select)
                qb.leftJoin('rl.locusMembers', 'rlm');
            }
        }

        // ------ Filters from rl table ------
        if (Array.isArray(id) && id.length > 0) {
            qb.andWhere('rl.id IN (:...ids)', { ids: id });
        }

        if (assemblyId) {
            qb.andWhere('rl.assemblyId = :assemblyId', { assemblyId });
        }

        // ------ Filters from rlm table ------
        if (hasRegionFilter) {
            qb.andWhere('rlm.regionId IN (:...regionIds)', { regionIds: regionId });
        }

        if (membershipStatus) {
            qb.andWhere('rlm.membershipStatus = :membershipStatus', {
                membershipStatus,
            });
        }

        // ------ Limited user restriction ------
        if (userRole === UserRole.LIMITED) {
            qb.andWhere('rlm.regionId IN (:...limitedRegionIds)', {
                limitedRegionIds: LIMITED_REGION_IDS,
            });
        }

        // ------ Sorting ------
        const sortFieldMap: Record<string, string> = {
            id: 'rl.id',
            assemblyId: 'rl.assemblyId',
            locusStart: 'rl.locusStart',
            locusStop: 'rl.locusStop',
            memberCount: 'rl.memberCount',
        };
        const sortField = sortFieldMap[sortBy] ?? 'rl.id';
        qb.orderBy(sortField, sortOrder as 'ASC' | 'DESC');

        // ------ Pagination ------
        const take = Math.min(limit, 1000);
        const skip = (page - 1) * take;
        qb.skip(skip).take(take);

        // Use groupBy to avoid duplicates when joining without sideload
        if (needsMemberJoin && include !== SideloadOption.LOCUS_MEMBERS) {
            qb.groupBy('rl.id');
        }

        const [data, total] = await qb.getManyAndCount();

        // Strip locusMembers when not sideloading
        if (include !== SideloadOption.LOCUS_MEMBERS) {
            data.forEach((locus) => {
                // Cast through unknown to allow deletion of non-optional property
                (locus as { locusMembers?: unknown }).locusMembers = undefined;
                delete (locus as { locusMembers?: unknown }).locusMembers;
            });
        }

        return { data, total, page, limit: take };
    }
}
