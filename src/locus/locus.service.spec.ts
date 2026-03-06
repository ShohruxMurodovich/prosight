import { Test, TestingModule } from '@nestjs/testing';
import { LocusService } from './locus.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RncLocus } from './entities/rnc-locus.entity';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../auth/users.data';
import { SideloadOption, SortByField, SortOrder } from './dto/locus-query.dto';

const mockQbFactory = (data: any[], total: number) => ({
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
});

const base = {
    page: 1,
    limit: 1000,
    sortBy: SortByField.ID,
    sortOrder: SortOrder.ASC,
};

const sampleRow: Partial<RncLocus> = {
    id: 3106326,
    assemblyId: 'WEWSeq_v.1.0',
    locusName: 'test-locus',
    publicLocusName: '432B32430F9FCBB8',
    chromosome: '4A',
    strand: '1',
    locusStart: 547925668,
    locusStop: 547987324,
    memberCount: 259,
    locusMembers: [],
};

describe('LocusService', () => {
    let service: LocusService;
    let qb: ReturnType<typeof mockQbFactory>;

    beforeEach(async () => {
        qb = mockQbFactory([sampleRow], 1);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocusService,
                {
                    provide: getRepositoryToken(RncLocus),
                    useValue: { createQueryBuilder: jest.fn().mockReturnValue(qb) },
                },
            ],
        }).compile();

        service = module.get<LocusService>(LocusService);
    });

    describe('admin', () => {
        it('returns paginated result shape', async () => {
            const result = await service.getLocus(base, UserRole.ADMIN);
            expect(result).toMatchObject({ data: expect.any(Array), total: 1, page: 1, limit: 1000 });
        });

        it('allows sideloading', async () => {
            await expect(
                service.getLocus({ ...base, include: SideloadOption.LOCUS_MEMBERS }, UserRole.ADMIN),
            ).resolves.toBeDefined();
        });

        it('applies id filter', async () => {
            await service.getLocus({ ...base, id: [1, 2, 3] }, UserRole.ADMIN);
            expect(qb.andWhere).toHaveBeenCalledWith('rl.id IN (:...ids)', expect.any(Object));
        });

        it('applies assemblyId filter', async () => {
            await service.getLocus({ ...base, assemblyId: 'WEWSeq_v.1.0' }, UserRole.ADMIN);
            expect(qb.andWhere).toHaveBeenCalledWith('rl.assemblyId = :assemblyId', expect.any(Object));
        });

        it('joins and filters by regionId', async () => {
            await service.getLocus({ ...base, regionId: [86118093] }, UserRole.ADMIN);
            expect(qb.leftJoin).toHaveBeenCalled();
            expect(qb.andWhere).toHaveBeenCalledWith('rlm.regionId IN (:...regionIds)', expect.any(Object));
        });

        it('applies membershipStatus filter', async () => {
            await service.getLocus({ ...base, membershipStatus: 'member' }, UserRole.ADMIN);
            expect(qb.andWhere).toHaveBeenCalledWith('rlm.membershipStatus = :membershipStatus', expect.any(Object));
        });
    });

    describe('normal', () => {
        it('strips locusMembers from result', async () => {
            const result = await service.getLocus(base, UserRole.NORMAL);
            expect(result.data[0]).not.toHaveProperty('locusMembers');
        });

        it('throws 403 when sideloading requested', async () => {
            await expect(
                service.getLocus({ ...base, include: SideloadOption.LOCUS_MEMBERS }, UserRole.NORMAL),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('limited', () => {
        it('always joins rnc_locus_members', async () => {
            await service.getLocus(base, UserRole.LIMITED);
            expect(qb.leftJoin).toHaveBeenCalled();
        });

        it('restricts to allowed region IDs', async () => {
            await service.getLocus(base, UserRole.LIMITED);
            expect(qb.andWhere).toHaveBeenCalledWith(
                'rlm.regionId IN (:...allowed)',
                { allowed: [86118093, 86696489, 88186467] },
            );
        });
    });

    describe('pagination', () => {
        it('defaults to page 1 limit 1000', async () => {
            await service.getLocus(base, UserRole.ADMIN);
            expect(qb.skip).toHaveBeenCalledWith(0);
            expect(qb.take).toHaveBeenCalledWith(1000);
        });

        it('caps limit at 1000', async () => {
            await service.getLocus({ ...base, limit: 5000 }, UserRole.ADMIN);
            expect(qb.take).toHaveBeenCalledWith(1000);
        });

        it('calculates offset from page', async () => {
            await service.getLocus({ ...base, page: 3, limit: 100 }, UserRole.ADMIN);
            expect(qb.skip).toHaveBeenCalledWith(200);
            expect(qb.take).toHaveBeenCalledWith(100);
        });
    });

    describe('sorting', () => {
        it('defaults to id ASC', async () => {
            await service.getLocus(base, UserRole.ADMIN);
            expect(qb.orderBy).toHaveBeenCalledWith('rl.id', 'ASC');
        });

        it('respects sortBy and sortOrder params', async () => {
            await service.getLocus(
                { ...base, sortBy: SortByField.MEMBER_COUNT, sortOrder: SortOrder.DESC },
                UserRole.ADMIN,
            );
            expect(qb.orderBy).toHaveBeenCalledWith('rl.memberCount', 'DESC');
        });
    });
});
