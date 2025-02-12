import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],  // Carga la config con TypeORM (academia_test)
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('debería crear un usuario y devolver su id y email (201)', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.email).toBe(registerDto.email);
      expect(response.body.password).toBeUndefined();
    });
  });

  describe('POST /auth/login', () => {
    it('debería devolver un token si el login es correcto (200)', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'secret123',
      };

      // Primero registramos el usuario
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(loginDto)
        .expect(201);

      // Luego logueamos
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.token).toBeDefined();
    });

    it('debería devolver 401 si las credenciales son incorrectas', async () => {
      const wrongLoginDto = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(wrongLoginDto)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});
