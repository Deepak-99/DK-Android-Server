import api from './api';
import {
    User,
    CreateUserDto,
    UpdateUserDto,
    UserFilter,
    PaginatedUsers
} from '../types/user';

class UserService {
    private baseUrl = '/api/v1/users';

    async getUsers(filter: UserFilter = {}): Promise<PaginatedUsers> {
        const params = new URLSearchParams();

        if (filter.search) params.append('search', filter.search);
        if (filter.role) params.append('role', filter.role);
        if (filter.isActive !== undefined) params.append('isActive', String(filter.isActive));
        if (filter.page) params.append('page', filter.page.toString());
        if (filter.limit) params.append('limit', filter.limit.toString());
        if (filter.sortBy) {
            const order = filter.sortOrder || 'asc';
            params.append('sort', `${filter.sortBy}:${order}`);
        }

        const response = await api.get<PaginatedUsers>(`${this.baseUrl}?${params.toString()}`);
        return response.data;
    }

    async getAllUsers(): Promise<User[]> {
        const response = await api.get<{ users: User[] }>(`${this.baseUrl}/all`);
        return response.data.users;
    }

    async getUserById(id: string): Promise<User> {
        const response = await api.get<{ user: User }>(`${this.baseUrl}/${id}`);
        return response.data.user;
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        const response = await api.post<{ user: User }>(this.baseUrl, userData);
        return response.data.user;
    }

    async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
        const response = await api.put<{ user: User }>(`${this.baseUrl}/${id}`, userData);
        return response.data.user;
    }

    async deleteUser(id: string): Promise<void> {
        await api.delete(`${this.baseUrl}/${id}`);
    }

    async updateUserStatus(id: string, isActive: boolean): Promise<User> {
        const response = await api.patch<{ user: User }>(`${this.baseUrl}/${id}/status`, { isActive });
        return response.data.user;
    }

    async resetPassword(id: string, newPassword: string): Promise<void> {
        await api.post(`${this.baseUrl}/${id}/reset-password`, { newPassword });
    }

    async getCurrentUser(): Promise<User> {
        const response = await api.get<{ user: User }>(`${this.baseUrl}/me`);
        return response.data.user;
    }

    async updateProfile(userData: Partial<User>): Promise<User> {
        const response = await api.patch<{ user: User }>(`${this.baseUrl}/me`, userData);
        return response.data.user;
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.post(`${this.baseUrl}/me/change-password`, { currentPassword, newPassword });
    }
}

export const userService = new UserService();