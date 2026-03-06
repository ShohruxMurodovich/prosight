import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocusController } from './locus.controller';
import { LocusService } from './locus.service';
import { RncLocus } from './entities/rnc-locus.entity';
import { RncLocusMember } from './entities/rnc-locus-member.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RncLocus, RncLocusMember])],
    controllers: [LocusController],
    providers: [LocusService],
    exports: [LocusService],
})
export class LocusModule { }
