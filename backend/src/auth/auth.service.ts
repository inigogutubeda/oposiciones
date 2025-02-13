// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * AuthService maneja registro y login de usuarios.
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  /**
   * Crea y persiste un nuevo usuario en la BD (registro).
   * @param userData objeto con email y password
   * @returns el usuario sin el password
   */
  async registerUser(userData: { email: string; password: string }) {
    const newUser = this.userRepo.create(userData);
    const savedUser = await this.userRepo.save(newUser);
    const { password, ...rest } = savedUser;
    return rest;
  }

  /**
   * Valida credenciales y genera un JWT si el login es correcto.
   * @param userData objeto con email y password
   * @returns null si credenciales son incorrectas, o { token: string } si son correctas
   */
  async loginUser(userData: { email: string; password: string }) {
    try {
      // Buscar al usuario en la BD
      const user = await this.userRepo.findOneBy({ email: userData.email });
      if (!user) {
        return null;
      }
      const isPasswordValid = await bcrypt.compare(userData.password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      // Si las credenciales son correctas, generamos un JWT real
      const payload = { email: user.email, sub: user.id };
      const token = this.jwtService.sign(payload);

      return { token };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}
