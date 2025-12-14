// public/admin/js/modules/services/ApiService.js
import { handleError } from '../utils/errorHandler.js';
import AuthService from './AuthService.js';

export class ApiService {
    constructor() {
        this.baseURL = '/api';
    }

  getAuthHeader() {
    const token = AuthService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  normalizeUrl(endpoint) {
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    // If already absolute API path → return as is
    if (endpoint.startsWith('/api/')) return endpoint;

    // Otherwise prefix baseURL
    return `${this.baseURL}${endpoint}`;
  }

  async request(method, endpoint, data = null) {
    const url = this.normalizeUrl(endpoint);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.getAuthHeader()
    };

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      const json = await res.json().catch(() => ({}));

      // Auto logout on 401
      if (res.status === 401) {
        AuthService.clearSession();
        window.location.href = '/admin';
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || json.message || `HTTP ${res.status}`);
      }

      return json;
    } catch (err) {
      handleError(`API request failed: ${method} ${endpoint}`, err);
      throw err;
    }
  }

  get(endpoint, params = null) {
    if (params) {
      const qs = new URLSearchParams(params).toString();
      endpoint += `?${qs}`;
    }
    return this.request('GET', endpoint);
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }

  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }

  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
}
