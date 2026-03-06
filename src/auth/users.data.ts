export enum UserRole {
    ADMIN = 'admin',
    NORMAL = 'normal',
    LIMITED = 'limited',
}

export interface User {
    id: number;
    username: string;
    password: string;
    role: UserRole;
}

export const USERS: User[] = [
    { id: 1, username: 'admin', password: 'admin123', role: UserRole.ADMIN },
    { id: 2, username: 'normal', password: 'normal123', role: UserRole.NORMAL },
    { id: 3, username: 'limited', password: 'limited123', role: UserRole.LIMITED },
];
