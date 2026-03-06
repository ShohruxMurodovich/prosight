import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: 3600 } }),
            ],
            providers: [AuthService],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('login', () => {
        it.each([
            ['admin', 'admin123', 'admin'],
            ['normal', 'normal123', 'normal'],
            ['limited', 'limited123', 'limited'],
        ])('%s with correct password returns accessToken', (username, password, _role) => {
            const result = service.login(username, password);
            expect(result).toHaveProperty('accessToken');
            expect(typeof result.accessToken).toBe('string');
        });

        it('throws UnauthorizedException for wrong password', () => {
            expect(() => service.login('admin', 'wrong')).toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException for unknown user', () => {
            expect(() => service.login('ghost', 'anything')).toThrow(UnauthorizedException);
        });
    });
});
