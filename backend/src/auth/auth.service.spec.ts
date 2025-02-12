import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

/**
 * Tests unitarios para AuthService.
 */
describe('AuthService', () => {
  let service: AuthService;
  let userRepoMock: Partial<Repository<User>>;
  let jwtServiceMock: Partial<JwtService>;

  beforeEach(async () => {
    // Mockeamos el repositorio de usuarios
    userRepoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((user) => ({
        id: Date.now(),
        ...user,
      })),
      findOneBy: jest.fn().mockImplementation((conditions) => {
        if (conditions.email === 'login@example.com') {
          return { id: 1, email: 'login@example.com', password: 'secret123' };
        }
        return null;
      }),
    };

    // Mockeamos el JwtService para que devuelva tokens falsos
    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };

    // Configuramos el módulo de pruebas
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerUser', () => {
    it('debería registrar un usuario y devolverlo sin la password', async () => {
      const result = await service.registerUser({
        email: 'new@example.com',
        password: 'secret',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe('new@example.com');
      expect((result as any).password).toBeUndefined();
      expect(userRepoMock.create).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'secret',
      });
      expect(userRepoMock.save).toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('debería devolver un token si las credenciales son correctas', async () => {
      const result = await service.loginUser({
        email: 'login@example.com',
        password: 'secret123',
      });

      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.token).toBeDefined();
        expect(result.token).toBe('fake-jwt-token');
      }
      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ email: 'login@example.com' });
      expect(jwtServiceMock.sign).toHaveBeenCalled();
    });

    it('debería devolver null si las credenciales son incorrectas', async () => {
      const result = await service.loginUser({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ email: 'wrong@example.com' });
    });
  });
});
