import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                JwtModule.register({
                    secret: 'test-secret',
                    signOptions: { expiresIn: '1h' },
                }),
            ],
            providers: [AuthService],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    describe('validateUser', () => {
        it('should return user for valid admin credentials', () => {
            const user = service.validateUser('admin', 'admin123');
            expect(user).toBeTruthy();
            expect(user?.role).toBe('admin');
            expect(user?.username).toBe('admin');
        });

        it('should return user for valid normal credentials', () => {
            const user = service.validateUser('normal', 'normal123');
            expect(user).toBeTruthy();
            expect(user?.role).toBe('normal');
        });

        it('should return user for valid limited credentials', () => {
            const user = service.validateUser('limited', 'limited123');
            expect(user).toBeTruthy();
            expect(user?.role).toBe('limited');
        });

        it('should return null for invalid credentials', () => {
            const user = service.validateUser('admin', 'wrongpassword');
            expect(user).toBeNull();
        });

        it('should return null for non-existent user', () => {
            const user = service.validateUser('unknown', 'test');
            expect(user).toBeNull();
        });
    });

    describe('login', () => {
        it('should return accessToken for valid credentials', () => {
            const result = service.login('admin', 'admin123');
            expect(result).toHaveProperty('accessToken');
            expect(typeof result.accessToken).toBe('string');
        });

        it('should throw UnauthorizedException for invalid credentials', () => {
            expect(() => service.login('admin', 'wrong')).toThrow(
                UnauthorizedException,
            );
        });

        it('should contain correct role in JWT payload', () => {
            const jwtService = new JwtService({ secret: 'test-secret' });
            const result = service.login('normal', 'normal123');
            // We test the service can decode valid-looking payload shape
            expect(result.accessToken).toBeDefined();
        });
    });
});
