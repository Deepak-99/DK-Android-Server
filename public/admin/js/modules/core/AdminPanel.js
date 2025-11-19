import { AuthService } from '../services/AuthService.js';
import { ApiService } from '../core/ApiService.js';
import { DeviceManager } from './DeviceManager.js';
import { WebSocketService } from './WebSocketService.js';
import { UIManager } from '../ui/UIManager.js';
import { handleError } from '../utils/errorHandler.js';

class AdminPanel {
    constructor() {
        console.log('Initializing AdminPanel...');
        this.token = AuthService.getToken();
        this.api = new ApiService(this.token);
        this.ui = new UIManager();
        this.deviceManager = new DeviceManager(this.api, this.ui);
        this.ws = new WebSocketService(this.handleWebSocketMessage.bind(this));
        this.elements = {};
        this.currentSection = 'dashboard';
        this.refreshInterval = null;

        // DOM ready initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        try {
            this.cacheElements();
            this.bindEvents();
            this.setupAccessibility();
            await this.init();
        } catch (err) {
            handleError('Failed to start admin panel', err, this.ui);
            this.showFatalError('Initialization Error', err.message || 'See console');
        }
    }

    cacheElements() {
        this.elements = {
            loginScreen: document.getElementById('login-screen'),
            loginForm: document.getElementById('loginForm'),
            app: document.getElementById('app'),
            logoutBtns: document.querySelectorAll('#logoutBtn'),
            statsContainer: document.getElementById('stats-container'),
            devicesContainer: document.getElementById('devices-container'),
            refreshDevicesBtn: document.getElementById('refresh-devices'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loginError: document.getElementById('login-error'),
            loginSpinner: document.getElementById('login-spinner'),
            loginText: document.getElementById('login-text')
        };
    }

    bindEvents() {
        // login
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                if (email && password) this.handleLogin(email, password);
            });
        }

        // logout
        this.elements.logoutBtns.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        }));

        // nav
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        if (this.elements.refreshDevicesBtn) {
            this.elements.refreshDevicesBtn.addEventListener('click', () => this.refreshCurrentSection());
        }

        // delegate device view click
        if (this.elements.devicesContainer) {
            this.elements.devicesContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.view-device');
                if (btn) this.viewDeviceDetails(btn.dataset.id);
            });
        }
    }

    setupAccessibility() {
        document.documentElement.lang = 'en';
    }

    showFatalError(title, message) {
        console.error('FATAL:', title, message);
        document.body.innerHTML = `<div class="p-4"><h3>${title}</h3><pre>${message}</pre><button onclick="location.reload()">Reload</button></div>`;
    }

    async init() {
        // show loading overlay
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'flex';
        const ok = await AuthService.verifySession();
        if (!ok) {
            this.showLogin();
            if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
            return;
        }
        await this.initializeApp();
        if (this.elements.loadingOverlay) this.elements.loadingOverlay.style.display = 'none';
    }

    setLoading(loading, msg) {
        if (this.ui && typeof this.ui.setLoading === 'function') this.ui.setLoading(loading, msg);
    }

    showLogin() {
        if (this.elements.loginScreen) this.elements.loginScreen.style.display = 'flex';
        if (this.elements.app) this.elements.app.classList.add('d-none');
    }

    showMainApp() {
        if (this.elements.loginScreen) this.elements.loginScreen.style.display = 'none';
        if (this.elements.app) this.elements.app.classList.remove('d-none');
    }

    async handleLogin(email, password) {
        try {
            // UI
            if (this.elements.loginSpinner) this.elements.loginSpinner.classList.remove('d-none');
            if (this.elements.loginText) this.elements.loginText.textContent = 'Signing in...';

            const data = await AuthService.login(email, password);
            this.api = new ApiService(AuthService.getToken());
            this.deviceManager = new DeviceManager(this.api, this.ui);

            this.ui.showNotification('Login successful!', 'success');
            this.showMainApp();
            await this.initializeApp();
        } catch (err) {
            console.error('Login failed', err);
            if (this.elements.loginError) {
                this.elements.loginError.classList.remove('d-none');
                this.elements.loginError.textContent = err.message || 'Login failed';
            }
            this.ui.showNotification(err.message || 'Login failed', 'error');
        } finally {
            if (this.elements.loginSpinner) this.elements.loginSpinner.classList.add('d-none');
            if (this.elements.loginText) this.elements.loginText.textContent = 'Sign In';
        }
    }

    async handleLogout() {
        AuthService.logout();
        if (this.ws && typeof this.ws.disconnect === 'function') this.ws.disconnect();
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.showLogin();
        this.ui.showNotification('Logged out', 'success');
    }

    async initializeApp() {
        this.setLoading(true, 'Initializing app');
        try {
            // load initial data
            await Promise.all([ this.refreshCurrentSection() ]);
            // connect websocket
            this.ws.connect();
            this.setupWebSocketListeners();
            this.setupPeriodicRefresh();
            this.showMainApp();
        } catch (err) {
            handleError('Init error', err, this.ui);
        } finally {
            this.setLoading(false);
        }
    }

    async loadDashboardStats() {
        try {
            const res = await this.api.get('/dashboard/stats');
            return res?.data || res || {};
        } catch (err) {
            console.warn('Dashboard stats not available', err);
            return {};
        }
    }

    updateDashboardStats(stats = {}) {
        const el = this.elements.statsContainer;
        if (!el) return;
        el.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3"><div class="card"><div class="card-body"><h5>Total Devices</h5><p class="display-6">${stats.totalDevices || stats.totalDevices || 0}</p></div></div></div>
                <div class="col-md-3"><div class="card"><div class="card-body"><h5>Online</h5><p class="display-6">${stats.activeDevices || stats.activeDevices || 0}</p></div></div></div>
                <div class="col-md-3"><div class="card"><div class="card-body"><h5>Offline</h5><p class="display-6">${stats.offlineDevices || 0}</p></div></div></div>
                <div class="col-md-3"><div class="card"><div class="card-body"><h5>Total Commands</h5><p class="display-6">${stats.totalCommands || 0}</p></div></div></div>
            </div>
        `;
    }

    updateDevicesList(devices = []) {
        const container = this.elements.devicesContainer;
        if (!container) return;
        if (!Array.isArray(devices) || devices.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No devices found.</div>`;
            return;
        }

        const sorted = [...devices].sort((a,b) => {
            if (a.status === 'online' && b.status !== 'online') return -1;
            if (a.status !== 'online' && b.status === 'online') return 1;
            const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
            const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
            return bTime - aTime;
        });

        container.innerHTML = `
            <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr><th>Device</th><th>Device ID</th><th>Status</th><th>Last Seen</th><th class="text-end">Actions</th></tr>
                </thead>
                <tbody>
                ${sorted.map(d => `
                    <tr data-device-id="${d.id}">
                        <td>
                            <div class="d-flex align-items-center">
                                <div style="width:10px;height:10px;border-radius:50%;background:${d.status === 'online' ? '#198754' : '#6c757d'};display:inline-block;margin-right:8px"></div>
                                <div>
                                    <div class="fw-medium">${d.nickname || d.name || 'Unnamed Device'}</div>
                                </div>
                            </div>
                        </td>
                        <td><code>${d.deviceId || 'N/A'}</code></td>
                        <td><span class="badge ${d.status === 'online' ? 'bg-success' : 'bg-secondary'}">${d.status || 'offline'}</span></td>
                        <td>${d.lastSeen ? new Date(d.lastSeen).toLocaleString() : 'Never'}</td>
                        <td class="text-end">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary view-device" data-id="${d.id}" title="View"><i class="bi bi-eye"></i></button>
                                <button class="btn btn-outline-secondary edit-device" data-id="${d.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
                </tbody>
            </table>
            </div>
        `;
    }

    async refreshCurrentSection() {
        try {
            if (this.currentSection === 'dashboard') {
                const [statsRes, devicesRes] = await Promise.all([
                    this.loadDashboardStats(),
                    this.deviceManager.loadDevices()
                ]);
                this.updateDashboardStats(statsRes);
                this.updateDevicesList(devicesRes);
            } else if (this.currentSection === 'devices') {
                const devicesRes = await this.deviceManager.loadDevices();
                this.updateDevicesList(devicesRes);
            }
        } catch (err) {
            console.error('Refresh error', err);
        }
    }

    showSection(section) {
        this.currentSection = section;
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.section === section);
        });
        this.refreshCurrentSection();
    }

    setupPeriodicRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') this.refreshCurrentSection();
        }, 30000);
    }

    setupWebSocketListeners() {
        if (!this.ws) return;
        this.ws.on('connect', () => console.log('WS connected'));
        this.ws.on('disconnect', () => console.log('WS disconnected'));
        this.ws.on('device-registered', (payload) => {
            this.ui.showNotification(`Device registered: ${payload.device?.name || payload.device?.deviceId}`, 'success');
            this.refreshCurrentSection();
        });
        this.ws.on('device-heartbeat', (payload) => {
            // payload should be normalized with deviceId, status, lastSeen
            console.log('heartbeat', payload);
            this.refreshCurrentSection();
        });
        this.ws.on('device-offline', (payload) => {
            console.log('device offline', payload);
            this.refreshCurrentSection();
        });
        this.ws.on('command-response', (payload) => {
            this.ui.showNotification(`Command response: ${payload.commandId || ''}`, 'info');
            this.refreshCurrentSection();
        });
    }

    handleWebSocketMessage(event) {
        // event dispatched by WebSocketService; handled above via on('type')
        console.log('WS message', event);
    }

    async viewDeviceDetails(deviceId) {
        try {
            this.setLoading(true, 'Loading device details...');
            const device = await this.deviceManager.getDeviceById(deviceId);
            console.log('Device details', device);
            if (this.ui) this.ui.showNotification(`Viewing ${device.nickname || device.name}`, 'info');
        } catch (err) {
            console.error('View device error', err);
            if (this.ui) this.ui.showNotification('Failed to load device details', 'error');
        } finally {
            this.setLoading(false);
        }
    }
}

export { AdminPanel };
