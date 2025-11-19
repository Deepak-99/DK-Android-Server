// ApiService.js - named ApiService for consistent imports
export class ApiService {
    constructor(token) {
        this.token = token || (window && window.localStorage && localStorage.getItem('hawkshaw_token'));
        this.baseURL = '/api';
        this.cache = new Map();
    }

    async call(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const method = (options.method || 'GET').toUpperCase();
        const cacheKey = `${method}:${url}`;

        if (method === 'GET') {
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < 30000) return cached.data;
        }

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const fetchOptions = { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined };

        const resp = await fetch(url, fetchOptions);
        if (resp.status === 401) {
            // token invalid — clear and refresh
            localStorage.removeItem('hawkshaw_token');
            throw new Error('Unauthorized');
        }

        const data = await resp.json().catch(() => ({}));
        if (method === 'GET') {
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
        }
        return data;
    }

    async get(endpoint) { return this.call(endpoint, { method: 'GET' }); }
    async post(endpoint, body) { return this.call(endpoint, { method: 'POST', body }); }
    async put(endpoint, body) { return this.call(endpoint, { method: 'PUT', body }); }
    async delete(endpoint) { return this.call(endpoint, { method: 'DELETE' }); }
}
