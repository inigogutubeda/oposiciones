import { Controller, Post, Body, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    const user = await this.authService.registerUser(body);
    // Por defecto, Nest manda 201 Created si devuelves un objeto en un POST
    return user;
  }

  @Post('login')
  @HttpCode(200) // Si todo va bien, 200 OK
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.loginUser(body);

    // Si es null => credenciales malas => 401 Unauthorized
    if (!result) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return result;
  }
}
