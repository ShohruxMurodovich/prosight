import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { LocusModule } from './locus/locus.module';
import { RncLocus } from './locus/entities/rnc-locus.entity';
import { RncLocusMember } from './locus/entities/rnc-locus-member.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'hh-pgsql-public.ebi.ac.uk',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'pfmegrnargs',
      username: process.env.DB_USER || 'reader',
      password: process.env.DB_PASSWORD || 'NWDMCE5xdipIjRrp',
      entities: [RncLocus, RncLocusMember],
      synchronize: false, // read-only DB — never sync
      ssl: false,
    }),
    AuthModule,
    LocusModule,
  ],
})
export class AppModule { }
