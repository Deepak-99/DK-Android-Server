// AuthService.js
export class AuthService {
    static TOKEN_KEY = 'hawkshaw_token';
    static USER_KEY = 'hawkshaw_user';

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    static getUser() {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    static setUser(user) {
        if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.USER_KEY);
        }
    }

    static async verifySession() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!res.ok) {
                this.setToken(null);
                this.setUser(null);
                return false;
            }
            const data = await res.json();
            if (data && data.user) {
                this.setUser(data.user);
            }
            return true;
        } catch (err) {
            console.error('verifySession error', err);
            return false;
        }
    }

    static async login(email, password) {
        try {
            const res = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            this.setToken(data.token);
            this.setUser(data.user || null);
            return data;
        } catch (err) {
            throw err;
        }
    }

    static logout() {
        this.setToken(null);
        this.setUser(null);
    }
}
