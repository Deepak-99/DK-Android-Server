// public/admin/js/modules/core/AdminPanel.js
import AuthService from '../services/AuthService.js';
import {ApiService} from '../services/ApiService.js';
import { DeviceManager } from './DeviceManager.js';
import { WebSocketService } from './WebSocketService.js';
import { UIManager } from '../ui/UIManager.js';
import { handleError, withErrorBoundary } from '../utils/errorHandler.js';

/**
 * AdminPanel - central orchestrator for admin UI
 */
export class AdminPanel {
  constructor() {
    // DI-like properties
    this.token = AuthService.getToken();
    if (!this.token) {
      throw new Error('Auth token missing. AdminPanel should be loaded after login.');
    }

    // core modules
    this.ui = new UIManager();
    this.api = new ApiService(this.token); // expects default export
    this.api.ui = this.ui;
    this.api.auth = AuthService;

    this.deviceManager = new DeviceManager(this.api);
    this.deviceManager.ui = this.ui;

    // state
    this.currentSection = 'dashboard';
    this.currentDeviceId = null;
    this.refreshInterval = null;

    // bind
    this.handleWebSocketEvent = this.handleWebSocketEvent.bind(this);
    this.onAuthChange = this.onAuthChange.bind(this);

    // WebSocket client for admin (custom client file)
    this.ws = new WebSocketService({
      onEvent: this.handleWebSocketEvent,
      onConnect: () => {
        this.ui?.showNotification('Realtime connected', 'success');
        // subscribe admin room already done by ws client on connect
      },
      onDisconnect: () => {
        this.ui?.showNotification('Realtime disconnected', 'warning');
      }
    });

    // watch auth changes (auto logout)
    AuthService.onChange(this.onAuthChange);

    // defer DOM caching until DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._bootstrap());
    } else {
      this._bootstrap();
    }
  }

  _bootstrap() {
    this.cacheElements();
    this.bindEvents();
    // don't call init() here — admin.js will call init() after constructing instance
  }

  cacheElements() {
    this.elements = {
      loginScreen: document.getElementById('login-screen'),
      app: document.getElementById('app'),
      logoutBtns: document.querySelectorAll('#logoutBtn'),
      statsContainer: document.getElementById('stats-container'),
      devicesContainer: document.getElementById('devices-container'),
      refreshDevicesBtn: document.getElementById('refresh-devices'),
      loadingOverlay: document.getElementById('loading-overlay')
    };
  }

  bindEvents() {
    // logout buttons
    Array.from(this.elements.logoutBtns || []).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    });

    // nav links
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.closest('[data-section]').dataset.section;
        this.showSection(section);
      });
    });

    // refresh devices btn
    if (this.elements.refreshDevicesBtn) {
      this.elements.refreshDevicesBtn.addEventListener('click', () => this.refreshCurrentSection());
    }

    // device delegated click
    if (this.elements.devicesContainer) {
      this.elements.devicesContainer.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-device');
        if (viewBtn) this.viewDeviceDetails(viewBtn.dataset.id);
      });
    }
  }

  async init() {
    try {
      this.ui.setLoading(true, 'Initializing...');
      // start websocket
      this.ws.connect();

      // load initial components
      await this.initializeComponents();

      // show app UI
      this.showMainApp();

      // start periodic refresh
      this.setupPeriodicRefresh();

      // set default section
      this.showSection('dashboard');
    } catch (err) {
      handleError('Failed to initialize application', err, this.ui);
      throw err;
    } finally {
      this.ui.setLoading(false);
    }
  }

  async initializeComponents() {
    // load stats + devices in parallel
    const [statsResp, devicesResp] = await Promise.allSettled([
      this.loadDashboardStats(),
      this.deviceManager.loadDevices()
    ]);

    const devices = (devicesResp.status === 'fulfilled' ? devicesResp.value : []);
    const stats = (statsResp.status === 'fulfilled' ? statsResp.value : {});

    this.updateDevicesList(devices);
    this.updateDashboardStats(stats);
  }

  async loadDashboardStats() {
    try {
      const resp = await this.api.get('/dashboard/stats');
      return resp.data || {};
    } catch (err) {
      console.warn('Dashboard stats unavailable', err);
      return {};
    }
  }

  updateDevicesList(devices = []) {
    const container = this.elements.devicesContainer;
    if (!container) return;

    // normalize to array
    if (!Array.isArray(devices)) devices = [];

    // normalize each device
    const normalized = devices.map(d => ({
      id: d.id ?? d.device_id ?? d.deviceId,
      deviceId: d.deviceId ?? d.device_id,
      name: d.name ?? d.device_name ?? d.nickname ?? 'Unnamed Device',
      status: d.status ?? (d.lastSeen || d.last_seen ? 'online' : 'offline'),
      lastSeen: d.lastSeen ?? d.last_seen ?? null,
      raw: d
    }));

    if (normalized.length === 0) {
      container.innerHTML = `<div class="alert alert-info mb-0">No devices found.</div>`;
      return;
    }

    const rows = normalized.map(d => `
      <tr data-device-id="${d.id}" class="${d.status === 'online' ? 'table-row-online' : ''}">
        <td>
          <div class="d-flex align-items-center">
            <div class="device-status-indicator me-2 ${d.status === 'online' ? 'bg-success' : 'bg-secondary'}"></div>
            <div>
              <div class="fw-medium">${d.name}</div>
            </div>
          </div>
        </td>
        <td><code title="${d.deviceId || 'N/A'}">${d.deviceId || 'N/A'}</code></td>
        <td><span class="badge bg-${d.status === 'online' ? 'success' : 'secondary'}">${d.status}</span></td>
        <td>${d.lastSeen ? new Date(d.lastSeen).toLocaleString() : 'Never'}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary view-device" data-id="${d.id}" title="View details"><i class="bi bi-eye"></i></button>
            <button class="btn btn-outline-secondary edit-device" data-id="${d.id}" title="Edit device"><i class="bi bi-pencil"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr><th>Device</th><th>Device ID</th><th>Status</th><th>Last Seen</th><th class="text-end">Actions</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  updateDashboardStats(stats = {}) {
    const el = this.elements.statsContainer;
    if (!el) return;

    el.innerHTML = `
      <div class="row g-3">
        ${this._card('Total Devices', stats.totalDevices)}
        ${this._card('Online Devices', stats.activeDevices)}
        ${this._card('Offline Devices', stats.offlineDevices)}
        ${this._card('Total Commands', stats.totalCommands)}
      </div>
    `;
  }

  _card(label, value) {
    return `
      <div class="col-md-3">
        <div class="card"><div class="card-body">
          <h5 class="card-title">${label}</h5>
          <p class="card-text display-6">${value ?? 0}</p>
        </div></div>
      </div>
    `;
  }

  // Refresh logic
  setupPeriodicRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') this.refreshCurrentSection();
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refreshCurrentSection();
    });
  }

  async refreshCurrentSection() {
    try {
      if (this.currentSection === 'dashboard') {
        const [stats, devices] = await Promise.allSettled([this.loadDashboardStats(), this.deviceManager.loadDevices()]);
        if (stats.status === 'fulfilled') this.updateDashboardStats(stats.value);
        if (devices.status === 'fulfilled') this.updateDevicesList(devices.value);
      } else if (this.currentSection === 'devices') {
        const devices = await this.deviceManager.loadDevices();
        this.updateDevicesList(devices);
      }
    } catch (err) {
      console.error('refreshCurrentSection error', err);
    }
  }

  showSection(section) {
    this.currentSection = section;
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.dataset.section === section) {
        link.classList.add('active'); link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active'); link.removeAttribute('aria-current');
      }
    });
    this.refreshCurrentSection();
  }

  showMainApp() {
    const loginScreen = this.elements.loginScreen;
    const app = this.elements.app;
    if (loginScreen) loginScreen.style.display = 'none';
    if (app) app.classList.remove('d-none');
  }

  showLogin() {
    const loginScreen = this.elements.loginScreen;
    const app = this.elements.app;
    if (loginScreen) loginScreen.style.display = 'flex';
    if (app) app.classList.add('d-none');
  }

  async handleLogout() {
    try {
      // clear session and reload to login UI
      this.ws.disconnect();
      AuthService.logout('/admin');
    } catch (err) {
      console.error('Logout error', err);
    }
  }

  async viewDeviceDetails(deviceId) {
    try {
      this.ui.setLoading(true, 'Loading device...');
      const device = await this.deviceManager.getDeviceById(deviceId);
      if (device) {
        this.currentDeviceId = device.id;
        this.ui.showNotification(`Viewing device: ${device.name || device.device_name}`, 'info');
      }
    } catch (err) {
      handleError('Failed to load device', err, this.ui);
    } finally {
      this.ui.setLoading(false);
    }
  }

  // Receive events from WebSocketService
  async handleWebSocketEvent(type, payload) {
    try {
      if (!type) return;
      switch (type) {
        case 'device-registered':
        case 'device_registered':
          this.ui?.showNotification(`New device registered: ${payload?.device?.device_name || payload?.device?.name || payload?.device?.deviceId}`, 'success');
          await this.refreshCurrentSection();
          break;
        case 'device-status':
        case 'device:status':
          // payload expected to include deviceId or device_id and status
          this._applyDeviceStatus(payload);
          break;
        case 'device-heartbeat':
        case 'device_heartbeat':
          // update UI for heartbeat
          this._applyDeviceStatus(payload);
          break;
        case 'command-response':
        case 'command_response':
          this.ui?.showNotification('Command response received', 'info');
          await this.refreshCurrentSection();
          break;
        case 'admin-status':
          // administrative status messages
          console.debug('admin-status', payload);
          break;
        default:
          console.debug('Unhandled WS event', type, payload);
      }
    } catch (err) {
      console.error('handleWebSocketEvent error', err);
    }
  }

  _applyDeviceStatus(payload) {
    // Try to find device in current list and update only that row
    const deviceId = payload?.deviceId ?? payload?.device_id ?? payload?.device?.deviceId ?? payload?.device?.device_id;
    const status = payload?.status ?? (payload?.isOnline ? 'online' : payload?.is_online ? 'online' : undefined);
    const lastSeen = payload?.lastSeen ?? payload?.last_seen ?? payload?.timestamp ?? new Date().toISOString();

    if (!deviceId) {
      // nothing to update
      return;
    }

    // update deviceManager cache if exists
    const idx = (this.deviceManager.devices || []).findIndex(d => (d.deviceId || d.device_id || d.id) == deviceId || d.id == deviceId);
    if (idx !== -1) {
      this.deviceManager.devices[idx] = {
        ...this.deviceManager.devices[idx],
        status: status ?? this.deviceManager.devices[idx].status,
        lastSeen
      };
      // refresh list UI
      this.updateDevicesList(this.deviceManager.devices);
    } else {
      // fallback: refresh entire list
      this.refreshCurrentSection();
    }
  }

  onAuthChange(payload) {
    if (!payload) return;
    if (payload.type === 'clear' || (payload.type === 'token' && !payload.token)) {
      // token cleared -> show login
      this.ws.disconnect();
      this.showLogin();
    }
  }
}
