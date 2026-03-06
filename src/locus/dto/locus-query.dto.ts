import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export enum SideloadOption {
    LOCUS_MEMBERS = 'locusMembers',
}

export enum SortByField {
    ID = 'id',
    ASSEMBLY_ID = 'assemblyId',
    LOCUS_START = 'locusStart',
    LOCUS_STOP = 'locusStop',
    MEMBER_COUNT = 'memberCount',
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class LocusQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by one or more locus IDs',
        type: [Number],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    id?: number[];

    @ApiPropertyOptional({
        description: 'Filter by assembly ID (single value)',
        example: 'WEWSeq_v.1.0',
    })
    @IsOptional()
    @IsString()
    assemblyId?: string;

    @ApiPropertyOptional({
        description: 'Filter by one or more region IDs (from rnc_locus_members)',
        type: [Number],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    regionId?: number[];

    @ApiPropertyOptional({
        description:
            'Filter by membership status (from rnc_locus_members), single value',
        example: 'member',
    })
    @IsOptional()
    @IsString()
    membershipStatus?: string;

    @ApiPropertyOptional({
        description: 'Sideload related data',
        enum: SideloadOption,
    })
    @IsOptional()
    @IsEnum(SideloadOption)
    include?: SideloadOption;

    @ApiPropertyOptional({
        description: 'Page number (1-based)',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of rows per page (max 1000)',
        default: 1000,
        minimum: 1,
        maximum: 1000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(1000)
    limit?: number = 1000;

    @ApiPropertyOptional({
        description: 'Field to sort by',
        enum: SortByField,
        default: SortByField.ID,
    })
    @IsOptional()
    @IsEnum(SortByField)
    sortBy?: SortByField = SortByField.ID;

    @ApiPropertyOptional({
        description: 'Sort direction',
        enum: SortOrder,
        default: SortOrder.ASC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.ASC;
}
