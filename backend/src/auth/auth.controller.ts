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
    const user = await this.authService.registerUser(body);
    // Por defecto, Nest  usa status 201 (CREATED) en un POST
    return user;
  }

  /**
   * POST /auth/login
   * Devuelve un token JWT si las credenciales son correctas.
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.loginUser(body);
    if (!result) {
      // Si loginUser retornó null, credenciales inválidas => 401 Unauthorized
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return result; // { token: '...' }
  }

  /**
   * GET /auth/profile
   * Ejemplo de ruta protegida por JWT. Necesita el Bearer Token en la cabecera:
   * Authorization: Bearer <token>
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    // req.user viene de la estrategia JwtStrategy (validate())
    return req.user;
  }
}
