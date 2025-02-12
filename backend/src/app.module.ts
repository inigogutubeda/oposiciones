import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'tu_contraseña',
      database: process.env.NODE_ENV === 'test' ? 'academia_test' : 'academia',
      entities: [User],
      synchronize: process.env.NODE_ENV !== 'test',
      dropSchema: process.env.NODE_ENV === 'test',
    }),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
