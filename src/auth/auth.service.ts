import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USERS } from './users.data';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    login(username: string, password: string) {
        const user = USERS.find((u) => u.username === username && u.password === password);

        if (!user) {
            throw new UnauthorizedException('Invalid login or password');
        }

        const token = this.jwtService.sign({
            sub: user.id,
            username: user.username,
            role: user.role,
        });

        return { accessToken: token };
    }
}
