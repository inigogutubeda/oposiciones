import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activar CORS (útil si el frontend es externo)
  app.enableCors();

  // Configurar un prefijo global para las rutas (opcional)
  app.setGlobalPrefix('api');

  // Aplicar validación automática a los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // Remueve propiedades no definidas en DTOs
    forbidNonWhitelisted: true,  // Bloquea propiedades no permitidas
    transform: true,  // Convierte los tipos de datos automáticamente
  }));

  // Configuración del puerto desde .env o default 3000
  const PORT = process.env.PORT || 3000;

  await app.listen(PORT);

  Logger.log(`🚀 Backend corriendo en: http://localhost:${PORT}`, 'Bootstrap');
}

// Si no estamos en modo test, arrancamos el servidor normalmente
if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

// En setup.ts
let app;
let moduleFixture;
app = moduleFixture.createNestApplication();
if (process.env.NODE_ENV === 'test') {
  app.setGlobalPrefix(''); // Remove prefix in tests
}

// Exportamos la función bootstrap para pruebas E2E
export { bootstrap };
