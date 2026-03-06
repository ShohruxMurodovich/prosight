import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USERS, User } from './users.data';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    validateUser(username: string, password: string): User | null {
        const user = USERS.find(
            (u) => u.username === username && u.password === password,
        );
        return user ?? null;
    }

    login(username: string, password: string): { accessToken: string } {
        const user = this.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, username: user.username, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
