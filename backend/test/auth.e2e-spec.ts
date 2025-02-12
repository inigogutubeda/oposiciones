import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada test
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
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
      token = response.body.token; // Guardamos el token para la siguiente prueba
    });

    it('debería devolver 401 si las credenciales son incorrectas', async () => {
      await request(server)
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('debería devolver 401 si no se proporciona un token', async () => {
      await request(server).get('/auth/profile').expect(401);
    });

    it('debería devolver 401 si el token es inválido', async () => {
      await request(server)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('debería devolver los datos del usuario si el token es válido', async () => {
      const response = await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.userId).toBeDefined();
      expect(response.body.email).toBe('test@example.com');
    });
  });
});
