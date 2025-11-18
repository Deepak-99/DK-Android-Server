// public/admin/js/modules/services/ApiService.js
import { handleError } from '../utils/errorHandler.js';
import { AuthService } from './AuthService.js';

export class ApiService {
    constructor() {
        this.baseURL = '/api';
    }

    getAuthHeader() {
        const token = AuthService.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async request(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...this.getAuthHeader()
        };

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
                credentials: 'include' // Include cookies for session handling
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                AuthService.clearToken();
                window.location.href = '/admin';
                return;
            }

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            handleError(`API request failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request('GET', endpoint);
    }

    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }
}
