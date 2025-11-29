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

        // states
        this.currentSection = "dashboard";
        this.currentDeviceId = null;
        this.refreshInterval = null;

        // map-related state
        this.map = null;
        this.mapMarker = null;
        this.mapTrail = null;
        this.mapHeat = null;
        this.mapInitialized = false;

        // binds
        this.handleWebSocketEvent = this.handleWebSocketEvent.bind(this);
        this.onAuthChange = this.onAuthChange.bind(this);

        // websocket client
        this.ws = new WebSocketService({
            onEvent: this.handleWebSocketEvent,
            onConnect: () => this.ui.showNotification("Realtime connected", 'success'),
            onDisconnect: () => this.ui.showNotification("Realtime disconnected", 'warning')
        });

        AuthService.onChange(this.onAuthChange);

        if (document.readyState === "loading")
            document.addEventListener("DOMContentLoaded", () => this._bootstrap());
        else this._bootstrap();
    }

    _bootstrap() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements = {
            loginScreen: document.getElementById('login-screen'),
            app: document.getElementById('app'),

            // main UI
            statsContainer: document.getElementById('stats-container'),
            devicesContainer: document.getElementById('devices-container'),
            refreshDevicesBtn: document.getElementById('refresh-devices'),
            logoutBtns: document.querySelectorAll('#logoutBtn, #logoutBtnSidebar'),
            loadingOverlay: document.getElementById('loading-overlay'),

            // map elements
            mapContainer: document.getElementById('map-container'),
            mapDiv: document.getElementById('map'),
            mapControls: document.getElementById('map-controls'),
            historyPanel: document.getElementById('location-history'),
            historyBody: document.getElementById('device-history'),

            // map buttons
            btnCenterMap: document.getElementById('btn-center-map'),
            btnHeatmap: document.getElementById('btn-heatmap'),
            btnTrail: document.getElementById('btn-trail'),
            btnClearMap: document.getElementById('btn-clear-map')
        };
    }

    bindEvents() {
        // logout buttons
        this.elements.logoutBtns.forEach(btn =>
            btn.addEventListener("click", () => this.handleLogout())
        );

        // nav links
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // refresh devices
        if (this.elements.refreshDevicesBtn)
            this.elements.refreshDevicesBtn.addEventListener("click", () => this.refreshCurrentSection());

        // delegated device click
        if (this.elements.devicesContainer) {
            this.elements.devicesContainer.addEventListener("click", (e) => {
                const viewBtn = e.target.closest('.view-device');
                if (viewBtn) this.viewDeviceDetails(viewBtn.dataset.id);
            });
        }

        // MAP BUTTON EVENTS
        if (this.elements.btnCenterMap)
            this.elements.btnCenterMap.addEventListener("click", () => this.centerMapOnLastKnown());

        if (this.elements.btnHeatmap)
            this.elements.btnHeatmap.addEventListener("click", () => this.toggleHeatmap());

        if (this.elements.btnTrail)
            this.elements.btnTrail.addEventListener("click", () => this.showMovementTrail());

        if (this.elements.btnClearMap)
            this.elements.btnClearMap.addEventListener("click", () => this.clearMap());
    }

    /** Main initialization after login */
    async init() {
        try {
            this.ui.setLoading(true, "Initializing...");
            this.ws.connect();

            await this.initializeComponents();

            this.showMainApp();
            this.setupPeriodicRefresh();
            this.showSection("dashboard");

        } catch (err) {
            handleError("Initialization failed", err, this.ui);
        } finally {
            this.ui.setLoading(false);
        }
    }

    /** Load dashboard + devices at startup */
    async initializeComponents() {
        const [statsResp, devicesResp] = await Promise.allSettled([
            this.loadDashboardStats(),
            this.deviceManager.loadDevices()
        ]);

        const stats = statsResp.status === "fulfilled" ? statsResp.value : {};
        const devices = devicesResp.status === "fulfilled" ? devicesResp.value : [];

        this.updateDashboardStats(stats);
        this.updateDevicesList(devices);
    }

    async loadDashboardStats() {
        try {
            const resp = await this.api.get('/dashboard/stats');
            return resp.data || {};
        } catch (_) {
            return {};
        }
    }

    /** Update dashboard */
    updateDashboardStats(stats = {}) {
        const el = this.elements.statsContainer;
        if (!el) return;

        el.innerHTML = `
            <div class="row g-3">
                ${this._card("Total Devices", stats.totalDevices)}
                ${this._card("Online Devices", stats.activeDevices)}
                ${this._card("Offline Devices", stats.offlineDevices)}
                ${this._card("Commands Executed", stats.totalCommands)}
            </div>
        `;
    }

    _card(label, value) {
        return `
        <div class="col-md-3">
            <div class="card shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${label}</h5>
                    <p class="card-text display-6">${value ?? 0}</p>
                </div>
            </div>
        </div>`;
    }

    /** Show or change section */
    showSection(section) {
        this.currentSection = section;

        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.section === section) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });

        this.refreshCurrentSection();

        // show map only in devices section
        if (section === "devices") {
            this.showMapUI();
        } else {
            this.hideMapUI();
        }
    }

    async refreshCurrentSection() {
        try {
            if (this.currentSection === "dashboard") {
                const [stats, devices] = await Promise.allSettled([
                    this.loadDashboardStats(),
                    this.deviceManager.loadDevices()
                ]);
                if (stats.status === "fulfilled") this.updateDashboardStats(stats.value);
                if (devices.status === "fulfilled") this.updateDevicesList(devices.value);
            }

            if (this.currentSection === "devices") {
                const devices = await this.deviceManager.loadDevices();
                this.updateDevicesList(devices);
            }

        } catch (err) {
            console.error("Refresh failed", err);
        }
    }

    /** Update Device List UI */
    updateDevicesList(devices = []) {
        const container = this.elements.devicesContainer;
        if (!container) return;

        if (!Array.isArray(devices)) devices = [];

        if (devices.length === 0) {
            container.innerHTML = `<div class="alert alert-info">No devices found.</div>`;
            return;
        }

        const rows = devices.map(d => {
            const id = d.id ?? d.device_id ?? d.deviceId;
            const name = d.name ?? d.device_name ?? d.nickname ?? "Unnamed Device";
            const status = d.status ?? (d.lastSeen ? 'online' : 'offline');
            const lastSeen = d.lastSeen ? new Date(d.lastSeen).toLocaleString() : 'Never';

            return `
                <tr>
                    <td>${name}</td>
                    <td><code>${d.deviceId ?? d.device_id}</code></td>
                    <td><span class="badge bg-${status === 'online' ? 'success' : 'secondary'}">${status}</span></td>
                    <td>${lastSeen}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-primary btn-sm view-device" data-id="${id}">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>`;
        }).join("");

        container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr><th>Device</th><th>Device ID</th><th>Status</th><th>Last Seen</th><th></th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    /** Select device → load details + show its map */
    async viewDeviceDetails(deviceId) {
        try {
            this.ui.setLoading(true, "Loading device...");

            const device = await this.deviceManager.getDeviceById(deviceId);
            if (!device) return;

            this.currentDeviceId = device.deviceId ?? device.device_id;
            this.ui.showNotification(`Viewing ${device.name}`, 'info');

            this.showMapUI();
            await this.loadDeviceHistory();

        } catch (err) {
            handleError("Failed to load device", err, this.ui);
        } finally {
            this.ui.setLoading(false);
        }
    }

    /** ------------------------------ MAP LOGIC ---------------------------- */

    /** Show + init map UI */
    showMapUI() {
        if (!this.elements.mapContainer) return;
        this.elements.mapContainer.style.display = "block";
        this.elements.mapControls.style.display = "block";
        this.elements.historyPanel.style.display = "block";

        if (!this.mapInitialized) this.initMap();
        setTimeout(() => this.map?.invalidateSize(), 250);
    }

    hideMapUI() {
        if (this.elements.mapContainer) this.elements.mapContainer.style.display = "none";
        if (this.elements.mapControls) this.elements.mapControls.style.display = "none";
        if (this.elements.historyPanel) this.elements.historyPanel.style.display = "none";
    }

    initMap() {
        if (!this.elements.mapDiv) return;

        this.map = L.map(this.elements.mapDiv).setView([20.5937, 78.9629], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19
        }).addTo(this.map);

        this.mapTrail = L.polyline([], { color: "blue", weight: 3 }).addTo(this.map);

        this.mapInitialized = true;
    }

    /** Center map on last known location */
    async centerMapOnLastKnown() {
        if (!this.currentDeviceId) return;

        const history = await this.fetchLocationHistory();
        if (!history || history.length === 0) return;

        const last = history[0];
        if (this.map) {
            this.map.setView([last.latitude, last.longitude], 17);
        }
    }

    /** Load location history into both: UI table + trail */
    async loadDeviceHistory() {
        if (!this.currentDeviceId || !this.elements.historyBody) return;

        const history = await this.fetchLocationHistory();

        if (!history || history.length === 0) {
            this.elements.historyBody.innerHTML = `<div class="text-muted small">No location history available.</div>`;
            return;
        }

        // fill table
        const rows = history.map(loc => `
            <div class="border-bottom py-2">
                <b>${new Date(loc.timestamp).toLocaleString()}</b><br>
                Lat: ${loc.latitude}, Lng: ${loc.longitude}<br>
                <i>${loc.address || "No address"}</i>
            </div>
        `).join("");

        this.elements.historyBody.innerHTML = rows;

        // update trail
        this.mapTrail.setLatLngs(history.map(h => [h.latitude, h.longitude]));
    }

    async fetchLocationHistory() {
        if (!this.currentDeviceId) return [];
        try {
            const resp = await this.api.get(`/devices/${this.currentDeviceId}/location/history`);
            return resp.data || [];
        } catch {
            return [];
        }
    }

    /** Real-time location update via websocket */
    applyLiveLocation(payload) {
        if (!payload || !this.map) return;

        const lat = payload.latitude;
        const lng = payload.longitude;

        if (!lat || !lng) return;

        if (!this.mapMarker) {
            this.mapMarker = L.marker([lat, lng]).addTo(this.map);
        } else {
            this.mapMarker.setLatLng([lat, lng]);
        }

        // extend trail
        this.mapTrail.addLatLng([lat, lng]);
    }

    toggleHeatmap() {
        if (!this.currentDeviceId) return;

        if (this.mapHeat) {
            this.map.removeLayer(this.mapHeat);
            this.mapHeat = null;
            return;
        }

        this.fetchLocationHistory().then(history => {
            const points = history.map(h => [h.latitude, h.longitude, 0.5]);
            this.mapHeat = L.heatLayer(points, { radius: 25 }).addTo(this.map);
        });
    }

    showMovementTrail() {
        this.mapTrail.setStyle({ opacity: 1 });
    }

    clearMap() {
        if (this.mapMarker) this.mapMarker.remove();
        this.mapMarker = null;

        this.mapTrail.setLatLngs([]);

        if (this.mapHeat) {
            this.map.removeLayer(this.mapHeat);
            this.mapHeat = null;
        }
    }

    /** ---------------------------- WEBSOCKET EVENTS ---------------------------- */

    async handleWebSocketEvent(type, payload) {
        if (!type) return;

        switch (type) {

            case "device-location":
                if (payload.deviceId === this.currentDeviceId) {
                    this.applyLiveLocation(payload);
                }
                break;

            case "device-heartbeat":
            case "device-status":
                this.refreshCurrentSection();
                break;

            case "device-registered":
                this.ui.showNotification("New device registered", 'success');
                this.refreshCurrentSection();
                break;

            case "command-response":
                this.ui.showNotification("Command response received", 'info');
                break;

            default:
                console.debug("Unhandled WS:", type, payload);
        }
    }

    /** ------------------------------ AUTH HANDLING ---------------------------- */

    showMainApp() {
        this.elements.loginScreen.style.display = "none";
        this.elements.app.classList.remove("d-none");
    }

    showLogin() {
        this.elements.loginScreen.style.display = "flex";
        this.elements.app.classList.add("d-none");
    }

    async handleLogout() {
        this.ws.disconnect();
        AuthService.logout('/admin');
    }

    onAuthChange(payload) {
        if (!payload) return;
        if (payload.type === "clear" || (payload.type === "token" && !payload.token)) {
            this.ws.disconnect();
            this.showLogin();
        }
    }

    /** Auto refresh */
    setupPeriodicRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === "visible") {
                this.refreshCurrentSection();
            }
        }, 30000);
    }
}
