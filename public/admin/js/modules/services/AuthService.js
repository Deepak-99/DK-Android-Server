// public/admin/js/modules/services/AuthService.js
// Note: default export to simplify imports in other modules

class AuthService {
  static TOKEN_KEY = 'hawkshaw_token';
  static USER_KEY = 'hawkshaw_user';
  static listeners = new Set();

  // --- simple eventing for auth changes ---
  static onChange(cb) {
    if (typeof cb === 'function') this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  static _emitChange(payload) {
    for (const cb of this.listeners) {
      try { cb(payload); } catch (e) { console.error('AuthService listener error', e); }
    }
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this._emitChange({ type: 'token', token });
  }

  static setUser(user) {
    if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(this.USER_KEY);
    this._emitChange({ type: 'user', user });
  }

  static getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
    } catch {
      return null;
    }
  }

  static clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._emitChange({ type: 'clear' });
  }

  static logout(redirect = '/admin') {
    this.clearSession();
    // best-effort server-side logout (fire-and-forget)
    try {
      fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${this.getToken()}` } }).catch(()=>{});
    } catch (_) {}
    // go to admin root (login will appear)
    window.location.href = redirect;
  }

  static async login(email, password) {
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        return { success: false, error: data?.error || data?.message || 'Invalid credentials' };
      }

      // Save token & user
      this.setToken(data.token);
      if (data.user) this.setUser(data.user);

      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      console.error('AuthService.login error', err);
      return { success: false, error: err.message || 'Network error' };
    }
  }

  static async verifySession() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(()=>({}));
      if (res.ok && data?.success) {
        if (data.user) this.setUser(data.user);
        return true;
      }
      // invalid token -> clear locally
      this.clearSession();
      return false;
    } catch (err) {
      console.error('AuthService.verifySession error', err);
      this.clearSession();
      return false;
    }
  }
}

export default AuthService;
