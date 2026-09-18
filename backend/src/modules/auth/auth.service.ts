import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { FirebaseService } from './firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
    private readonly configService: ConfigService
  ) {}

  private getAllowedEmails(): string[] {
    const raw = this.configService.get<string>('ALLOWED_EMAILS');
    if (!raw) return [];
    return raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  private assertAllowed(email: string): void {
    const allowed = this.getAllowedEmails();
    if (allowed.length === 0) return;
    if (!allowed.includes(email.toLowerCase())) {
      throw new ForbiddenException(
        'Acesso restrito. Esta conta não está autorizada.'
      );
    }
  }

  private buildPayload(user: any) {
    return {
      sub: (user as any)._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private async issueToken(user: any) {
    const payload = this.buildPayload(user);
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: payload.sub,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  async login(email: string, password: string) {
    this.assertAllowed(email);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Esta conta usa login com Google. Use o botão do Google para entrar.'
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueToken(user);
  }

  async loginWithGoogle(idToken: string) {
    const decoded = await this.firebaseService.verifyIdToken(idToken);

    if (!decoded.email || !decoded.email_verified) {
      throw new UnauthorizedException(
        'Não foi possível validar o email da conta Google.'
      );
    }

    this.assertAllowed(decoded.email);

    const user = await this.usersService.findOrCreateGoogleUser({
      email: decoded.email,
      name: decoded.name ?? decoded.email.split('@')[0],
      googleId: decoded.uid,
      avatarUrl: decoded.picture,
    });

    return this.issueToken(user);
  }

  async register(data: { name: string; email: string; password: string }) {
    const user = await this.usersService.createUser(data);
    return this.issueToken(user);
  }
}
