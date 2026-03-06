import {
    Controller,
    Get,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../auth/users.data';
import { LocusService } from './locus.service';
import { LocusQueryDto } from './dto/locus-query.dto';

@ApiTags('Locus')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.NORMAL, UserRole.LIMITED)
@Controller('locus')
export class LocusController {
    constructor(private readonly locusService: LocusService) { }

    @Get()
    @ApiOperation({
        summary: 'Get locus records',
        description: `
Returns paginated locus records from rnc_locus (rl) table.
Optionally sideloads rnc_locus_members data with include=locusMembers.

**Permissions:**
- **admin**: full access to all columns + sideloading
- **normal**: access to rl table columns only; sideloading is forbidden (403)
- **limited**: data restricted to regionId IN (86118093, 86696489, 88186467)
    `,
    })
    @ApiResponse({
        status: 200,
        description: 'Paginated locus records',
        schema: {
            example: {
                data: [
                    {
                        id: 3106326,
                        assemblyId: 'WEWSeq_v.1.0',
                        locusName:
                            'cfc38349@4A/547925668-547987324:1',
                        publicLocusName: '432B32430F9FCBB8',
                        chromosome: '4A',
                        strand: '1',
                        locusStart: 547925668,
                        locusStop: 547987324,
                        memberCount: 259,
                    },
                ],
                total: 1,
                page: 1,
                limit: 1000,
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient role permissions' })
    async getLocus(
        @Query() query: LocusQueryDto,
        @Request() req: { user: { role: UserRole } },
    ) {
        return this.locusService.getLocus(query, req.user.role);
    }
}
