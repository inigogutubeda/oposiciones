import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;

  // Creamos un mock de UserRepository para no usar la base de datos real
  let userRepoMock: Partial<Repository<User>>;

  beforeEach(async () => {
    // Mockeamos los métodos de TypeORM que usaremos en AuthService
    userRepoMock = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((user) => {
        // Simulamos que se guarda y retorna un objeto con id auto-generado
        return { id: Date.now(), ...user };
      }),
      findOneBy: jest.fn().mockImplementation((conditions) => {
        // Simulamos la búsqueda por email
        // Ejemplo: si el email es "login@example.com", devolvemos un user
        if (conditions.email === 'login@example.com') {
          return {
            id: 1,
            email: conditions.email,
            password: 'secret123',
          };
        }
        return null;
      }),
    };

    // Creamos el módulo de testing con AuthService y el mock del repo
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepoMock, // inyectamos el mock
        },
      ],
    }).compile();

    // Obtenemos la instancia real del AuthService
    service = module.get<AuthService>(AuthService);
  });

  // Test básico que ya tenías: comprueba que el servicio exista
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Bloque de tests para registerUser
  describe('registerUser method', () => {
    it('debería registrar un usuario y devolverlo sin la password', async () => {
      const email = 'test@example.com';
      const password = '123456';

      // Llamamos al servicio (ahora asíncrono)
      const result = await service.registerUser({ email, password });

      // Comprobamos que se ha devuelto un objeto con id y email
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(email);
      // Verificamos que no exista la password en el objeto final
      expect((result as any).password).toBeUndefined();

      // Aseguramos que userRepoMock.create y userRepoMock.save fueron llamados
      expect(userRepoMock.create).toHaveBeenCalledWith({ email, password });
      expect(userRepoMock.save).toHaveBeenCalled();
    });
  });

  // Bloque de tests para loginUser
  describe('loginUser method', () => {
    it('debería devolver un token si las credenciales son correctas', async () => {
      const email = 'login@example.com';
      const password = 'secret123';

      // Llamamos a loginUser
      const result = await service.loginUser({ email, password });

      // Primero comprobamos que no sea null (por si TypeScript se queja)
      expect(result).not.toBeNull();

      // Si queremos más protección: un if, así TypeScript sabe que no es null
      if (result !== null) {
        // Esperamos un objeto con { token }
        expect(result.token).toBeDefined();
      }

      // userRepoMock.findOneBy se habrá invocado para buscar por email
      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ email });
    });

    it('debería devolver null si las credenciales son incorrectas', async () => {
      const email = 'wrong@example.com';
      const password = 'wrongpassword';

      // Llamamos a loginUser con credenciales incorrectas
      const result = await service.loginUser({ email, password });

      expect(result).toBeNull();
      // Revisamos que haya intentado encontrar un user por ese email
      expect(userRepoMock.findOneBy).toHaveBeenCalledWith({ email });
    });
  });
});
