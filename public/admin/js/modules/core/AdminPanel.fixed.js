// public/admin/js/modules/core/AdminPanel.js
import AuthService from '../services/AuthService.js';
import { ApiService } from '../services/ApiService.js';
import { DeviceManager } from './DeviceManager.js';
import { WebSocketService } from './WebSocketService.js';
import { UIManager } from '../ui/UIManager.js';
import { handleError, withErrorBoundary } from '../utils/errorHandler.js';

/**
 * Main AdminPanel class that orchestrates the admin dashboard
 */
class AdminPanel {
    /**
     * Initialize a new AdminPanel instance
     */
    constructor() {
        try {
            console.log('Initializing AdminPanel...');

            // Initialize properties
            this.token = AuthService.getToken();
            this.currentSection = 'dashboard';
            this.currentDeviceId = null;
            this.isInitialized = false;
            this.isLoading = false;
            this.pendingOperations = new Map();
            this.refreshInterval = null;

            // Initialize UI first
            console.log('Initializing UIManager...');
            this.ui = new UIManager();
            this.ui.setLoading(true, 'Initializing...');

            // Initialize other services
            console.log('Initializing other services...');
            this.api = new ApiService();
            this.deviceManager = new DeviceManager(this.api);

            // Initialize WebSocket with error handling
            try {
                this.ws = this.createMockWebSocket();
                
                // Try to initialize real WebSocket
                try {
                    this.ws = new WebSocketService(this.handleWebSocketMessage.bind(this));
                    console.log('WebSocket service initialized successfully');
                    this.setupWebSocketListeners();
                } catch (wsError) {
                    console.warn('Failed to initialize WebSocket, using mock service:', wsError);
                }
            } catch (error) {
                console.warn('Error during WebSocket initialization:', error);
            }

            // Set up error handling
            this.setupErrorHandling();

            // Cache DOM elements after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.cacheElements();
                    this.setupAccessibility();
                    this.bindEvents();
                    this.init();
                });
            } else {
                this.cacheElements();
                this.setupAccessibility();
                this.bindEvents();
                this.init();
            }

        } catch (error) {
            console.error('Fatal error in AdminPanel constructor:', error);
            this.showFatalError('Critical Error', 'Failed to initialize the application. Please check the console for details.');
            throw error;
        }
    }

    /**
     * Set up error handling for the application
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            if (this.ui) {
                this.ui.showNotification('An unexpected error occurred', 'error');
            }
        });

        // Handle global errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error || event.message);
            if (this.ui) {
                this.ui.showNotification('A critical error occurred', 'error');
            }
            event.preventDefault();
        });
    }

    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        this.elements = {
            loginScreen: document.getElementById('login-screen'),
            loginForm: document.getElementById('loginForm'),
            app: document.getElementById('app'),
            logoutBtns: document.querySelectorAll('#logoutBtn'),
            statsContainer: document.getElementById('stats-container'),
            devicesContainer: document.getElementById('devices-container'),
            refreshDevicesBtn: document.getElementById('refresh-devices')
        };
    }

    /**
     * Set up accessibility features
     */
    setupAccessibility() {
        document.documentElement.setAttribute('lang', 'en');
        
        // Ensure all buttons and links are keyboard accessible
        const interactiveElements = document.querySelectorAll('button:not([tabindex]), a:not([tabindex])');
        interactiveElements.forEach(el => {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Login form
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email')?.value;
                const password = document.getElementById('password')?.value;
                if (email && password) {
                    this.handleLogin(email, password);
                }
            });
        }

        // Logout buttons
        this.elements.logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });

        // Navigation links
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });

        // Refresh devices button
        if (this.elements.refreshDevicesBtn) {
            this.elements.refreshDevicesBtn.addEventListener('click', () => {
                this.refreshCurrentSection();
            });
        }

        // Device row clicks (delegated event)
        if (this.elements.devicesContainer) {
            this.elements.devicesContainer.addEventListener('click', (e) => {
                const viewBtn = e.target.closest('.view-device');
                if (viewBtn) {
                    const deviceId = viewBtn.dataset.id;
                    if (deviceId) {
                        this.viewDeviceDetails(deviceId);
                    }
                }
            });
        }
    }

    /**
     * Show a fatal error message to the user
     */
    showFatalError(title = 'Fatal Error', message = 'The application encountered a critical error and cannot continue.') {
        console.error(`[FATAL] ${title}: ${message}`);

        // If UI is available, show error
        if (this.ui && typeof this.ui.showError === 'function') {
            this.ui.showError(title, message);
            return;
        }

        // Fallback to basic error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger m-3';
        errorDiv.role = 'alert';
        errorDiv.innerHTML = `
            <h4 class="alert-heading">${title}</h4>
            <p>${message}</p>
            <hr>
            <p class="mb-0">
                <button class="btn btn-sm btn-outline-danger" onclick="window.location.reload()">
                    Reload Application
                </button>
            </p>
        `;

        // Clear the page and show error
        document.body.innerHTML = '';
        document.body.appendChild(errorDiv);
    }

    /**
     * Main initialization method
     */
    async init() {
        try {
            // Check authentication
            if (await AuthService.verifySession()) {
                await this.initializeApp();
            } else {
                this.showLogin();
            }
        } catch (error) {
            handleError('Initialization error:', error, this.ui);
            this.showLogin();
        }
    }

    /**
     * Initialize the application
     */
    async initializeApp() {
        try {
            this.setLoading(true, 'Initializing...');

            // Initialize components
            await this.initializeComponents();

            // Show main app
            this.showMainApp();

            // Connect to WebSocket
            if (this.ws && typeof this.ws.connect === 'function') {
                this.ws.connect();
            }

            // Initialize real-time updates
            this.initializeRealtimeUpdates();

            // Show dashboard by default
            this.showSection('dashboard');

        } catch (error) {
            handleError('Failed to initialize application', error, this.ui);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Initialize application components
     */
    async initializeComponents() {
        try {
            // Load initial data
            const [devices, stats] = await Promise.all([
                this.deviceManager.loadDevices().catch(error => {
                    console.warn('Could not load devices:', error.message);
                    return [];
                }),
                this.loadDashboardStats().catch(error => {
                    console.warn('Could not load dashboard stats:', error.message);
                    return {};
                })
            ]);

            // Update UI
            this.updateDevicesList(devices);
            this.updateDashboardStats(stats);

        } catch (error) {
            handleError('Failed to initialize components', error, this.ui);
            throw error;
        }
    }

    /**
     * Load dashboard statistics
     */
    async loadDashboardStats() {
        try {
            const stats = await this.api.get('/dashboard/stats').catch(() => ({}));
            return stats?.data || stats || {};
        } catch (error) {
            console.warn('Dashboard stats endpoint not available');
            return {};
        }
    }

    /**
     * Update the devices list in the UI
     */
    updateDevicesList(devices = []) {
        try {
            const devicesContainer = this.elements.devicesContainer;
            if (!devicesContainer) {
                console.warn('Devices container not found');
                return;
            }

            if (!Array.isArray(devices) || devices.length === 0) {
                devicesContainer.innerHTML = '<div class="alert alert-info">No devices found</div>';
                return;
            }

            devicesContainer.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Name / Nickname</th>
                                <th>Model</th>
                                <th>Status</th>
                                <th>Last Seen</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${devices.map(device => `
                                <tr data-device-id="${device.id}">
                                    <td>
                                        <div>${device.nickname || device.name || 'Unnamed Device'}</div>
                                        ${device.nickname && device.name ? `<small class="text-muted">${device.name}</small>` : ''}
                                    </td>
                                    <td>${device.model || 'Unknown'}</td>
                                    <td>
                                        <span class="badge bg-${device.status === 'online' || device.isOnline ? 'success' : 'secondary'}">
                                            ${device.status || 'unknown'}
                                        </span>
                                    </td>
                                    <td>${device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary view-device" data-id="${device.id}">
                                            <i class="bi bi-eye"></i> View
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error updating devices list:', error);
        }
    }

    /**
     * Update dashboard statistics in the UI
     */
    updateDashboardStats(stats = {}) {
        try {
            const statsContainer = this.elements.statsContainer;
            if (!statsContainer) {
                console.warn('Stats container not found');
                return;
            }

            statsContainer.innerHTML = `
                <div class="row g-3">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Total Devices</h5>
                                <p class="card-text display-6">${stats.totalDevices || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Online Devices</h5>
                                <p class="card-text display-6">${stats.activeDevices || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Offline Devices</h5>
                                <p class="card-text display-6">${stats.offlineDevices || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Total Commands</h5>
                                <p class="card-text display-6">${stats.totalCommands || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }

    /**
     * Initialize real-time updates using WebSocket
     */
    initializeRealtimeUpdates() {
        // Set up periodic refresh
        this.setupPeriodicRefresh();
    }

    /**
     * Set up periodic refresh of data
     */
    setupPeriodicRefresh() {
        // Clear any existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Set up new refresh interval (30 seconds)
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshCurrentSection();
            }
        }, 30000);

        // Add visibility change listener
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshCurrentSection();
            }
        });
    }

    /**
     * Refresh the currently active section
     */
    async refreshCurrentSection() {
        try {
            const activeSection = this.currentSection || 'dashboard';

            switch (activeSection) {
                case 'dashboard':
                    return Promise.all([
                        this.loadDashboardStats().then(stats => {
                            this.updateDashboardStats(stats);
                            return stats;
                        }),
                        this.deviceManager.loadDevices().then(devices => {
                            this.updateDevicesList(devices);
                            return devices;
                        })
                    ]);
                case 'devices':
                    return this.deviceManager.loadDevices()
                        .then(devices => {
                            this.updateDevicesList(devices);
                            return devices;
                        });
                default:
                    console.warn('No refresh handler for section:', activeSection);
                    return Promise.resolve();
            }
        } catch (error) {
            console.error('Error in refreshCurrentSection:', error);
            handleError('Failed to refresh data', error, this.ui);
        }
    }

    /**
     * Show a section and hide others
     */
    showSection(section) {
        // Update current section
        this.currentSection = section;

        // Update active navigation
        this.updateActiveNav(section);

        // For now, just log - full section switching will be implemented
        console.log(`Showing section: ${section}`);
        
        // Refresh data for the section
        this.refreshCurrentSection();
    }

    /**
     * Update active navigation state
     */
    updateActiveNav(activeSection) {
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.section === activeSection) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    }

    /**
     * Set loading state
     */
    setLoading(isLoading, message = 'Loading...') {
        this.isLoading = isLoading;
        if (this.ui && typeof this.ui.setLoading === 'function') {
            this.ui.setLoading(isLoading, message);
        }
    }

    /**
     * Show login form
     */
    showLogin() {
        if (this.elements.loginScreen) {
            this.elements.loginScreen.style.display = 'flex';
        }
        if (this.elements.app) {
            this.elements.app.classList.add('d-none');
        }
        
        // Clear any existing token
        AuthService.setToken(null);
    }

    /**
     * Show main app
     */
    showMainApp() {
        if (this.elements.loginScreen) {
            this.elements.loginScreen.style.display = 'none';
        }
        if (this.elements.app) {
            this.elements.app.classList.remove('d-none');
        }
    }

    /**
     * Handle login form submission
     */
    async handleLogin(email, password) {
        this.setLoading(true, 'Signing in...');

        try {
            const response = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('No authentication token received');
            }

            // Save the token
            AuthService.setToken(data.token);

            // Update the API service with the new token
            this.api = new ApiService();

            // Initialize the application
            await this.initializeApp();

            // Show success notification
            if (this.ui) {
                this.ui.showNotification('Login successful!', 'success');
            }

        } catch (error) {
            console.error('Login error:', error);
            if (this.ui) {
                this.ui.showNotification(
                    error.message || 'Login failed. Please check your credentials and try again.',
                    'error'
                );
            }

            // Clear password field on error
            const passwordField = document.getElementById('password');
            if (passwordField) passwordField.value = '';

        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            // Notify server about logout
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${AuthService.getToken()}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(err => console.warn('Logout API call failed:', err));
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            // Clear local state
            AuthService.setToken(null);
            this.token = null;

            // Clean up intervals
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }

            // Clean up socket connection
            if (this.ws && typeof this.ws.disconnect === 'function') {
                this.ws.disconnect();
            }

            // Show login screen
            this.showLogin();

            // Show logout success message
            if (this.ui) {
                this.ui.showNotification('You have been successfully logged out', 'success');
            }
        }
    }

    /**
     * View device details
     */
    async viewDeviceDetails(deviceId) {
        try {
            this.setLoading(true, 'Loading device details...');
            const device = await this.deviceManager.getDeviceById(deviceId);
            
            if (device) {
                this.currentDeviceId = device.id;
                // TODO: Show device detail view
                console.log('Device details:', device);
                if (this.ui) {
                    this.ui.showNotification(`Viewing device: ${device.nickname || device.name}`, 'info');
                }
            }
        } catch (error) {
            handleError(`Failed to load device ${deviceId}`, error, this.ui);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Create a mock WebSocket service for fallback
     */
    createMockWebSocket() {
        console.log('Creating mock WebSocket service');
        return {
            on: (event, callback) => {
                console.log(`[Mock] Added ${event} listener`);
                return this;
            },
            off: (event) => {
                console.log(`[Mock] Removed ${event} listener`);
                return this;
            },
            send: (data) => {
                console.log('[Mock] Sending data:', data);
                return Promise.resolve();
            },
            connect: () => {
                console.log('[Mock] WebSocket connected');
                return this;
            },
            disconnect: () => {
                console.log('[Mock] WebSocket disconnected');
                return this;
            }
        };
    }

    /**
     * Setup WebSocket listeners
     */
    setupWebSocketListeners() {
        if (!this.ws) return;

        this.ws.on('connect', () => {
            console.log('WebSocket connected');
            if (this.currentDeviceId) {
                this.subscribeToDevice(this.currentDeviceId);
            }
        });

        this.ws.on('disconnect', () => {
            console.log('WebSocket disconnected');
        });

        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        this.ws.on('device-status', (data) => {
            this.handleDeviceStatusUpdate(data);
        });

        this.ws.on('device-registered', (data) => {
            if (this.ui) {
                this.ui.showNotification(`New device registered: ${data.device.device_name}`, 'success');
            }
            this.refreshCurrentSection();
        });
    }

    /**
     * Subscribe to device updates
     */
    subscribeToDevice(deviceId) {
        if (!this.ws || !deviceId) return;

        console.log(`Subscribing to device ${deviceId}`);
        this.ws.send({
            type: 'subscribe',
            deviceId: deviceId
        }).catch(error => {
            console.error('Failed to subscribe to device:', error);
        });
    }

    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(event) {
        try {
            const data = typeof event === 'string' ? JSON.parse(event) : event;
            console.log('WebSocket message received:', data);

            if (!data || !data.type) {
                console.warn('Received WebSocket message without type:', data);
                return;
            }

            // Handle different message types
            switch (data.type) {
                case 'device:status':
                    this.handleDeviceStatusUpdate(data);
                    break;

                case 'device:data':
                    this.handleDeviceDataUpdate(data);
                    break;

                case 'notification':
                    if (this.ui) {
                        this.ui.showNotification(data.message, data.level || 'info');
                    }
                    break;

                default:
                    console.log('Unhandled WebSocket message type:', data.type);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }

    /**
     * Handle device status update from WebSocket
     */
    handleDeviceStatusUpdate(data) {
        console.log('Device status update:', data);
        // TODO: Update device status in UI
    }

    /**
     * Handle device data update from WebSocket
     */
    handleDeviceDataUpdate(data) {
        console.log('Device data update:', data);
        // TODO: Update device data in UI
    }
}

// Make AdminPanel available globally in browser environment
if (typeof window !== 'undefined') {
    try {
        window.AdminPanel = AdminPanel;
    } catch (e) {
        console.error('Failed to set AdminPanel on window:', e);
    }
}

// Export the AdminPanel class
export { AdminPanel };
