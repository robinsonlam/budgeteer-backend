import { Controller, Post, UseGuards, Request, Body, Get, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard, GoogleAuthGuard } from './guards/auth.guards';
import { CreateUserDto, LoginUserDto } from '../users/dto/user.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req) {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const result = await this.authService.login(req.user);
    
    // Redirect to frontend with token
    const redirectUrl = `http://localhost:3000/auth/success?token=${result.access_token}`;
    res.redirect(redirectUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
