import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { AppController } from './app.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',    // Ajusta a tu usuario
      password: '@Haliax201408498',    // Ajusta a tu contraseña
      database: 'academia_test',// BD de test
      entities: [User],
      synchronize: true,
      dropSchema: true,         // Limpia y recrea tablas cada vez
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
