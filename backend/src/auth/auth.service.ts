import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async registerUser(userData: { email: string; password: string }) {
    const newUser = this.userRepo.create(userData);
    const savedUser = await this.userRepo.save(newUser);
    // Retornamos sin el password
    const { password, ...rest } = savedUser;
    return rest;
  }

  async loginUser(userData: { email: string; password: string }) {
    const user = await this.userRepo.findOneBy({ email: userData.email });
    // Compara password en texto plano (luego podemos usar bcrypt)
    if (!user || user.password !== userData.password) {
      return null;
    }
    // Devolvemos un token ficticio
    return {
      token: `fake-jwt-for-${user.email}-${user.id}`,
    };
  }
}
