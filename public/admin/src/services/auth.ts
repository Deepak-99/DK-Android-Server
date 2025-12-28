import api from './api';

interface LoginResponse {
    user: any;
    token: string;
}

export const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.user;
};

export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } finally {
        localStorage.removeItem('token');
    }
};

export const refreshToken = async () => {
    const { data } = await api.post<{ token: string }>('/auth/refresh-token');
    localStorage.setItem('token', data.token);
    return data.token;
};