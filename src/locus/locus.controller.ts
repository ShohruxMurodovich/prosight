import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../auth/users.data';
import { LocusService } from './locus.service';
import { LocusQueryDto } from './dto/locus-query.dto';

@ApiTags('Locus')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.NORMAL, UserRole.LIMITED)
@Controller('locus')
export class LocusController {
    constructor(private readonly locusService: LocusService) { }

    @Get()
    @ApiOperation({
        summary: 'Get locus records',
        description:
            'Returns paginated locus records. ' +
            'Admin gets all columns + optional sideloading. ' +
            'Normal users get rl table only. ' +
            'Limited users are restricted to 3 allowed region IDs.',
    })
    @ApiResponse({ status: 200, description: 'Paginated list of locus records' })
    @ApiResponse({ status: 401, description: 'Missing or invalid token' })
    @ApiResponse({ status: 403, description: 'Role does not have access' })
    getLocus(@Query() query: LocusQueryDto, @Req() req: Request & { user: { role: UserRole } }) {
        return this.locusService.getLocus(query, req.user.role);
    }
}
