import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto, LoginUserDto } from '../users/dto/user.dto';
import { User } from '../users/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && await this.usersService.validatePassword(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateGoogleUser(profile: any): Promise<User> {
    let user = await this.usersService.findByGoogleId(profile.id);
    
    if (!user) {
      // Check if user exists with same email
      user = await this.usersService.findByEmail(profile.emails[0].value);
      if (!user) {
        // Create new user
        user = await this.usersService.createGoogleUser(profile);
      }
    }
    
    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const user = await this.usersService.create(createUserDto);
    return this.login(user);
  }
}
