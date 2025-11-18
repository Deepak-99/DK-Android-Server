/**
 * Admin Panel Main Entry Point
 * Handles initialization and error handling for the admin interface
 */

// Import AdminPanel module
import { AdminPanel } from './modules/core/AdminPanel.js';
import { AuthService } from './modules/services/AuthService.js';

// Prevent admin panel from loading when not logged in
const token = AuthService.getToken();
if (!token) {
    console.warn("No auth token found. Redirecting to login screen...");
    document.getElementById('app')?.classList.add('d-none');
    document.getElementById('login-screen')?.classList.remove('d-none');
    throw new Error("AdminPanel blocked until login");
}
/**
 * Shows a fatal error message to the user
 * @param {string} title - Error title
 * @param {string} message - Error message
 */
function showFatalError(title, message) {
    console.error(`FATAL ERROR [${title}]:`, message);
    
    // Create or update error container
    let errorContainer = document.getElementById('fatal-error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'fatal-error-container';
        errorContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #f8f9fa;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        const errorContent = document.createElement('div');
        errorContent.style.cssText = `
            max-width: 800px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            width: 100%;
        `;
        
        const errorHeader = document.createElement('div');
        errorHeader.style.cssText = `
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            font-size: 1.2em;
            font-weight: bold;
        `;
        errorHeader.textContent = title || 'Fatal Error';
        
        const errorBody = document.createElement('div');
        errorBody.style.padding = '20px';
        errorBody.textContent = message || 'An unknown error occurred';
        
        const errorFooter = document.createElement('div');
        errorFooter.style.cssText = `
            padding: 15px 20px;
            background: #f8f9fa;
            text-align: right;
            border-top: 1px solid #dee2e6;
        `;
        
        const reloadButton = document.createElement('button');
        reloadButton.textContent = 'Reload Page';
        reloadButton.style.cssText = `
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        reloadButton.onclick = () => window.location.reload();
        
        errorFooter.appendChild(reloadButton);
        errorContent.appendChild(errorHeader);
        errorContent.appendChild(errorBody);
        errorContent.appendChild(errorFooter);
        errorContainer.appendChild(errorContent);
        document.body.appendChild(errorContainer);
        
        // Hide any loading indicators
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

/**
 * Load the admin panel
 */
async function loadAdminPanel() {
    try {
        console.log('Loading AdminPanel module...');
        
        // Initialize the admin panel
        const adminPanel = new AdminPanel();
        
        // Initialize the admin panel
        await adminPanel.init();
        
        console.log('AdminPanel initialized successfully');
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        return adminPanel;
    } catch (error) {
        console.error('Failed to load admin panel:', error);
        showFatalError(
            'Initialization Error', 
            'Failed to initialize the admin panel. Please check the console for details.'
        );
        throw error; // Re-throw to be caught by the global error handler
    }
}

// Show loading state
async function initAdminPanel() {
    console.log('DOM fully loaded, initializing admin panel...');
    
    try {
        // Show loading overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Load the admin panel
        await loadAdminPanel();
    } catch (error) {
        console.error('Failed to initialize admin panel:', error);
        showFatalError('Initialization Error', 'Failed to initialize the admin panel. Please check the console for details.');
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error || event.message);
    showFatalError(
        'Unhandled Error',
        'An unexpected error occurred. Please check the console for details.'
    );
    return false; // Prevent default error handling
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showFatalError(
        'Unhandled Promise Rejection',
        'An unexpected error occurred in a promise. Please check the console for details.'
    );
    event.preventDefault();
});

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}
