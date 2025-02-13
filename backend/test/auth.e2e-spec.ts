import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { ValidationPipe } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.test.env'
        }),
        AuthModule,
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();
    server = app.getHttpServer();
    dataSource = moduleFixture.get(DataSource);
  }, 30000);

  beforeEach(async () => {
    // Clear database before each test
    if (dataSource.isInitialized) {
      await dataSource.synchronize(true);
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    it('debería registrar un usuario correctamente', async () => {
      const response = await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.email).toBe('test@example.com');
      expect(response.body.password).toBeUndefined();
    });

    it('debería devolver 400 si el email está mal formado', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'invalid-email', password: '123456' })
        .expect(400);
    });

    it('debería devolver 400 si la contraseña es muy corta', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123' })
        .expect(400);
    });

    it('debería devolver 409 si el email ya está registrado', async () => {
      // Primer registro
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' })
        .expect(201);

      // Intento de registro duplicado
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('debería devolver un token si las credenciales son correctas', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' })
        .expect(201);

      const response = await request(server)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: '123456' })
        .expect(200);

      expect(response.body.token).toBeDefined();
      token = response.body.token;
    });

    it('debería devolver 401 si las credenciales son incorrectas', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('debería devolver 400 si faltan campos requeridos', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: 'test@example.com' }) // Sin password
        .expect(400);
    });

    it('debería devolver token con formato JWT válido', async () => {
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' });

      const response = await request(server)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: '123456' })
        .expect(200);

      expect(response.body.token).toMatch(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/
      );
    });
  });

  describe('GET /auth/profile', () => {
    it('debería devolver 401 si no se proporciona un token', async () => {
      await request(server).get('/auth/profile').expect(401);
    });

    it('debería devolver los datos del usuario si el token es válido', async () => {
      const response = await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBeDefined();
      expect(response.body.email).toBe('test@example.com');
    });

    it('debería devolver 401 si el token es inválido', async () => {
      await request(server)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('debería devolver 401 si el token está expirado', async () => {
      // Primero necesitamos modificar el JWT_SECRET para generar un token expirado
      process.env.JWT_EXPIRES_IN = '0s';
      
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: '123456' });

      await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(401);
    });

    it('debería devolver la información correcta del usuario', async () => {
      // Registrar y login
      await request(server)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: '123456' });

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: '123456' });

      const profileResponse = await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(profileResponse.body).toEqual({
        userId: expect.any(Number),
        email: 'test@example.com'
      });
    });
  });
});
