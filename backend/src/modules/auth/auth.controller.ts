import {
  Body,
  Controller,
  Get,
  Req,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from './public.decorator';
import { Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';

const ACCESS_TOKEN_COOKIE = 'accessToken';

function setAccessTokenCookie(res: Response, accessToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { accessToken, user } = await this.authService.login(
      body.email,
      body.password
    );

    setAccessTokenCookie(res, accessToken);

    return { user };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('google')
  async google(
    @Body() body: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { accessToken, user } = await this.authService.loginWithGoogle(
      body.idToken
    );

    setAccessTokenCookie(res, accessToken);

    return { user };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { accessToken, user } = await this.authService.register(body);

    setAccessTokenCookie(res, accessToken);

    return { user };
  }

  @Public()
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request & { user?: any }) {
    return req.user || null;
  }
}
