import { Test, TestingModule } from '@nestjs/testing';
import { LocusService } from './locus.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RncLocus } from './entities/rnc-locus.entity';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../auth/users.data';
import { SideloadOption, SortByField, SortOrder } from './dto/locus-query.dto';

// Mock query builder
const createMockQb = (data: any[], total: number) => ({
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
});

describe('LocusService', () => {
    let service: LocusService;
    let mockQb: ReturnType<typeof createMockQb>;

    const mockLocusData: Partial<RncLocus>[] = [
        {
            id: 3106326,
            assemblyId: 'WEWSeq_v.1.0',
            locusName: 'test-locus-name',
            publicLocusName: '432B32430F9FCBB8',
            chromosome: '4A',
            strand: '1',
            locusStart: 547925668,
            locusStop: 547987324,
            memberCount: 259,
            locusMembers: [],
        },
    ];

    beforeEach(async () => {
        mockQb = createMockQb(mockLocusData, 1);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocusService,
                {
                    provide: getRepositoryToken(RncLocus),
                    useValue: {
                        createQueryBuilder: jest.fn().mockReturnValue(mockQb),
                    },
                },
            ],
        }).compile();

        service = module.get<LocusService>(LocusService);
    });

    const defaultQuery = {
        page: 1,
        limit: 1000,
        sortBy: SortByField.ID,
        sortOrder: SortOrder.ASC,
    };

    describe('Role: admin', () => {
        it('should return paginated results without sideload', async () => {
            const result = await service.getLocus(defaultQuery, UserRole.ADMIN);
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('total');
            expect(result.page).toBe(1);
            expect(result.limit).toBe(1000);
        });

        it('should allow sideloading for admin', async () => {
            // Should not throw
            await expect(
                service.getLocus(
                    { ...defaultQuery, include: SideloadOption.LOCUS_MEMBERS },
                    UserRole.ADMIN,
                ),
            ).resolves.toBeDefined();
        });

        it('should apply id filter', async () => {
            await service.getLocus({ ...defaultQuery, id: [1, 2, 3] }, UserRole.ADMIN);
            expect(mockQb.andWhere).toHaveBeenCalledWith(
                'rl.id IN (:...ids)',
                expect.any(Object),
            );
        });

        it('should apply assemblyId filter', async () => {
            await service.getLocus(
                { ...defaultQuery, assemblyId: 'WEWSeq_v.1.0' },
                UserRole.ADMIN,
            );
            expect(mockQb.andWhere).toHaveBeenCalledWith(
                'rl.assemblyId = :assemblyId',
                expect.any(Object),
            );
        });

        it('should apply regionId filter with join', async () => {
            await service.getLocus(
                { ...defaultQuery, regionId: [86118093] },
                UserRole.ADMIN,
            );
            expect(mockQb.leftJoin).toHaveBeenCalled();
            expect(mockQb.andWhere).toHaveBeenCalledWith(
                'rlm.regionId IN (:...regionIds)',
                expect.any(Object),
            );
        });

        it('should apply membershipStatus filter', async () => {
            await service.getLocus(
                { ...defaultQuery, membershipStatus: 'member' },
                UserRole.ADMIN,
            );
            expect(mockQb.andWhere).toHaveBeenCalledWith(
                'rlm.membershipStatus = :membershipStatus',
                expect.any(Object),
            );
        });
    });

    describe('Role: normal', () => {
        it('should return data without locusMembers', async () => {
            const result = await service.getLocus(defaultQuery, UserRole.NORMAL);
            expect(result.data[0]).not.toHaveProperty('locusMembers');
        });

        it('should throw ForbiddenException when include=locusMembers', async () => {
            await expect(
                service.getLocus(
                    { ...defaultQuery, include: SideloadOption.LOCUS_MEMBERS },
                    UserRole.NORMAL,
                ),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('Role: limited', () => {
        it('should always apply regionId restriction', async () => {
            await service.getLocus(defaultQuery, UserRole.LIMITED);
            expect(mockQb.andWhere).toHaveBeenCalledWith(
                'rlm.regionId IN (:...limitedRegionIds)',
                { limitedRegionIds: [86118093, 86696489, 88186467] },
            );
        });

        it('should always join rnc_locus_members even without sideloading', async () => {
            await service.getLocus(defaultQuery, UserRole.LIMITED);
            expect(mockQb.leftJoin).toHaveBeenCalled();
        });
    });

    describe('Pagination', () => {
        it('should apply default pagination values', async () => {
            await service.getLocus(defaultQuery, UserRole.ADMIN);
            expect(mockQb.skip).toHaveBeenCalledWith(0);
            expect(mockQb.take).toHaveBeenCalledWith(1000);
        });

        it('should cap limit at 1000', async () => {
            await service.getLocus({ ...defaultQuery, limit: 9999 }, UserRole.ADMIN);
            expect(mockQb.take).toHaveBeenCalledWith(1000);
        });

        it('should apply page offset', async () => {
            await service.getLocus({ ...defaultQuery, page: 3, limit: 100 }, UserRole.ADMIN);
            expect(mockQb.skip).toHaveBeenCalledWith(200);
            expect(mockQb.take).toHaveBeenCalledWith(100);
        });
    });

    describe('Sorting', () => {
        it('should sort by id ASC by default', async () => {
            await service.getLocus(defaultQuery, UserRole.ADMIN);
            expect(mockQb.orderBy).toHaveBeenCalledWith('rl.id', 'ASC');
        });

        it('should sort by memberCount DESC if specified', async () => {
            await service.getLocus(
                {
                    ...defaultQuery,
                    sortBy: SortByField.MEMBER_COUNT,
                    sortOrder: SortOrder.DESC,
                },
                UserRole.ADMIN,
            );
            expect(mockQb.orderBy).toHaveBeenCalledWith('rl.memberCount', 'DESC');
        });
    });
});
