export type UserRole = 'admin' | 'user' | 'manager';

export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    avatar?: string;
    twoFactorEnabled?: boolean;
    lastLoginIp?: string;
    lastLoginUserAgent?: string;
}

export interface CreateUserDto {
    username: string;
    email: string;
    fullName: string;
    password: string;
    role: UserRole;
    isActive?: boolean;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password' | 'username'>> {
    password?: string;
}

export interface UserFilter {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsers {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}