// src/auth/controller/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpException,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

/**
 * AuthController expone las rutas de registro y login,
 * además de un ejemplo de ruta protegida con JWT (profile).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Crea un usuario en la BD.
   */
  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.authService.registerUser(body);
      return user;
    } catch (error) {
      if (error.code === '23505') { // Postgres unique violation
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  /**
   * POST /auth/login
   * Devuelve un token JWT si las credenciales son correctas.
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string }) {
    try {
      const result = await this.authService.loginUser(body);
      if (!result) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }

  /**
   * GET /auth/profile
   * Ejemplo de ruta protegida por JWT. Necesita el Bearer Token en la cabecera:
   * Authorization: Bearer <token>
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    try {
      return req.user;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
