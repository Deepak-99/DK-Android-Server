// public/admin/js/modules/core/APIService.js

/**
 * Centralized API communication + response normalization
 */
class APIService {
    constructor(token) {
        this.token = token;
        this.baseURL = '/api';
        this.cache = new Map();

        // optional: injected by AdminPanel
        this.ui = null;
        this.auth = null;
    }

    /**
     * Universal GET helper
     */
    async get(endpoint, params = {}) {
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            endpoint = `${endpoint}?${queryString}`;
        }
        return this.call(endpoint, { method: 'GET' });
    }

    /**
     * Universal POST helper
     */
    async post(endpoint, body = {}) {
        return this.call(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Universal PUT helper
     */
    async put(endpoint, body = {}) {
        return this.call(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * Universal DELETE helper
     */
    async delete(endpoint) {
        return this.call(endpoint, { method: 'DELETE' });
    }

    /**
     * Normalize server responses into predictable structure
     */
    normalizeResponse(data) {

        // API error but backend responded with { success:false }
        if (data && data.success === false) {
            return {
                success: false,
                error: data.error || data.message || 'Unknown server error'
            };
        }

        // Base normalized structure
        const normalized = {
            success: data?.success !== false,
            data:
                data?.data ||
                (Array.isArray(data) ? data : {}) ||
                {},
            devices: [],
            device: null
        };

        // Extract devices from multiple backend formats
        if (Array.isArray(normalized.data?.devices)) {
            normalized.devices = normalized.data.devices;
        } else if (Array.isArray(data?.devices)) {
            normalized.devices = data.devices;
        } else if (Array.isArray(data)) {
            normalized.devices = data;
        }

        // Single device normalization
        if (normalized.data?.device) {
            normalized.device = normalized.data.device;
        } else if (data?.device) {
            normalized.device = data.device;
        }

        return normalized;
    }

    /**
     * Main API caller
     */
    async call(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const method = options.method || 'GET';
        const cacheKey = `${method}:${url}`;

        // Serve from cache if possible
        if (method === 'GET') {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 30000) {
                return cached.data; // already normalized data
            }
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    ...options.headers
                }
            });

            // Auto-handle unauthorized (token expired)
            if (response.status === 401) {
                console.warn('Token expired or invalid');

                if (this.ui) {
                    this.ui.showNotification('Session expired. Please login again.', 'warning');
                }

                if (this.auth) {
                    this.auth.logout();
                }

                return { success: false, error: 'Unauthorized' };
            }

            // Parse response body
            const raw = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message = raw?.error || raw?.message || response.statusText;
                return { success: false, error: message };
            }

            // Normalize response format
            const normalized = this.normalizeResponse(raw);

            // Cache GET requests
            if (method === 'GET') {
                this.cache.set(cacheKey, {
                    data: normalized,
                    timestamp: Date.now()
                });
            } else {
                // Invalidate cache on write operations
                this.cache.clear();
            }

            return normalized;

        } catch (error) {
            console.error('API request failed:', error);

            return {
                success: false,
                error: error.message || 'Network error'
            };
        }
    }
}

export default APIService;
