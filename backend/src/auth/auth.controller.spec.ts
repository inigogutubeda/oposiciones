import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: Partial<AuthService>;

  beforeEach(async () => {
    // Creamos un mock de AuthService
    authServiceMock = {
      // Simulamos registerUser, devolviendo un objeto ficticio
      registerUser: jest.fn().mockResolvedValue({ id: 1, email: 'mock@example.com' }),
      // Simulamos loginUser, devolviendo un objeto con token
      loginUser: jest.fn().mockResolvedValue({ token: 'fake-token' }),
    };

    // Creamos el módulo de testing con el controlador y el mock del servicio
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register method', () => {
    it('debería llamar a AuthService y devolver el usuario sin password', async () => {
      const body = { email: 'test@example.com', password: '123456' };
      const result = await controller.register(body);

      // Comprobamos que AuthService.registerUser haya sido llamado
      expect(authServiceMock.registerUser).toHaveBeenCalledWith(body);
      // Verificamos la respuesta mock
      expect(result).toEqual({ id: 1, email: 'mock@example.com' });
    });
  });

  describe('login method', () => {
    it('debería devolver un token si las credenciales son correctas', async () => {
      const body = { email: 'test@example.com', password: '123456' };
      const result = await controller.login(body);

      // Comprobamos que AuthService.loginUser haya sido llamado
      expect(authServiceMock.loginUser).toHaveBeenCalledWith(body);
      // Verificamos la respuesta mock
      expect(result).toEqual({ token: 'fake-token' });
    });
  });
});
