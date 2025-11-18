// public/admin/js/modules/ui/UIManager.js
import { Modal } from './Modal.js';
import { debounce, throttle } from '../utils/helpers.js';
import { handleError } from '../utils/errorHandler.js';
import { CONFIG } from '../../config.js';

/**
 * Handles all UI-related functionality for the admin panel
 */
export class UIManager {
    constructor() {
        this.elements = {};
        this.modals = new Map();
        this.notifications = new Set();
        this.cacheElements();
        this.setupEventListeners();
    }

    // Element Caching
    // ==============

    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        try {
            // Main containers
            this.elements = {
                app: document.getElementById('app'),
                loadingOverlay: document.getElementById('loading-overlay'),
                notificationContainer: document.getElementById('notification-container'),
                mainContent: document.querySelector('main'),
                sidebar: document.querySelector('.sidebar'),
                topNav: document.querySelector('.top-nav'),
                loginScreen: document.getElementById('login-screen')
            };
            
            // Log missing elements for debugging
            for (const [key, element] of Object.entries(this.elements)) {
                if (!element) {
                    console.warn(`Element not found: ${key}`);
                }
            }
            
            // Ensure loading overlay is initially hidden
            if (this.elements.loadingOverlay) {
                this.elements.loadingOverlay.style.display = 'none';
            }
            
            // Show login screen by default if it exists
            if (this.elements.loginScreen) {
                this.elements.loginScreen.style.display = 'flex';
            }
            
        } catch (error) {
            console.error('Error in cacheElements:', error);
            throw error;
        }
    }

    /**
     * Get a cached element or query for it
     * @param {string} selector - CSS selector or element ID
     * @returns {HTMLElement|null} The matching element
     */
    getElement(selector) {
        // Check if it's a direct property
        if (this.elements[selector]) {
            return this.elements[selector];
        }

        // Query the DOM if not found in cache
        const element = document.querySelector(selector);
        if (element) {
            this.elements[selector] = element;
        }
        return element;
    }

    // Loading State
    // =============

    /**
     * Show or hide loading state
     * @param {boolean} show - Whether to show or hide loading state
     * @param {string} message - Loading message to display
     */
    setLoading(show, message = 'Loading...') {
        const { loadingOverlay } = this.elements;
        if (!loadingOverlay) return;

        if (show) {
            const messageEl = loadingOverlay.querySelector('.loading-message') ||
                document.createElement('div');

            messageEl.className = 'loading-message';
            messageEl.textContent = message;

            if (!loadingOverlay.contains(messageEl)) {
                loadingOverlay.appendChild(messageEl);
            }

            loadingOverlay.style.display = 'flex';
            loadingOverlay.setAttribute('aria-busy', 'true');
            loadingOverlay.setAttribute('aria-live', 'polite');
        } else {
            loadingOverlay.style.display = 'none';
            loadingOverlay.removeAttribute('aria-busy');
        }
    }

    // Notifications
    // =============

    /**
     * Show a notification to the user
     * @param {string} message - The message to display
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {string} duration - How long to show the notification in ms
     * @returns {string} Notification ID
     */
    showNotification(message, type = 'info', duration = CONFIG.ui.notificationDuration) {
        const id = `notification-${Date.now()}`;
        const notification = document.createElement('div');

        notification.id = id;
        notification.className = `notification notification-${type} fade-in`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', 'Close notification');
        closeButton.addEventListener('click', () => this.removeNotification(id));

        // Add message
        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;

        notification.appendChild(messageEl);
        notification.appendChild(closeButton);

        // Add to container
        if (!this.elements.notificationContainer) {
            this.elements.notificationContainer = document.createElement('div');
            this.elements.notificationContainer.className = 'notification-container';
            document.body.appendChild(this.elements.notificationContainer);
        }

        this.elements.notificationContainer.appendChild(notification);
        this.notifications.add(id);

        // Auto-remove notification
        if (duration > 0) {
            setTimeout(() => this.removeNotification(id), duration);
        }

        return id;
    }

    /**
     * Remove a notification by ID
     * @param {string} id - Notification ID
     */
    removeNotification(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
                this.notifications.delete(id);
            }, 300); // Match CSS transition duration
        }
    }

    // Modals
    // ======

    /**
     * Create and show a modal
     * @param {Object} options - Modal options
     * @returns {Modal} The created modal instance
     */
    showModal(options) {
        const modal = new Modal(options);
        modal.show();

        if (options.id) {
            this.modals.set(options.id, modal);
            modal.onClose = () => {
                this.modals.delete(options.id);
                if (typeof options.onClose === 'function') {
                    options.onClose();
                }
            };
        }

        return modal;
    }

    /**
     * Get a modal by ID
     * @param {string} id - Modal ID
     * @returns {Modal|undefined} The modal instance
     */
    getModal(id) {
        return this.modals.get(id);
    }

    // Form Handling
    // =============

    /**
     * Get form data as an object
     * @param {HTMLFormElement} form - The form element
     * @returns {Object} Form data as key-value pairs
     */
    getFormData(form) {
        if (!(form instanceof HTMLFormElement)) {
            throw new Error('Invalid form element');
        }

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            // Handle multiple values for the same key (e.g., checkboxes)
            if (key in data) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    /**
     * Validate a form using HTML5 validation
     * @param {HTMLFormElement} form - The form to validate
     * @returns {boolean} Whether the form is valid
     */
    validateForm(form) {
        if (!form.checkValidity()) {
            // Trigger browser's native validation UI
            form.reportValidity();
            return false;
        }
        return true;
    }

    // UI Updates
    // ==========

    /**
     * Update the page title
     * @param {string} title - New page title
     */
    setPageTitle(title) {
        document.title = `${title} | Admin Panel`;
    }

    /**
     * Toggle a class on an element
     * @param {string} selector - CSS selector
     * @param {string} className - Class to toggle
     * @param {boolean} [force] - Force add or remove the class
     */
    toggleClass(selector, className, force) {
        const element = this.getElement(selector);
        if (element) {
            element.classList.toggle(className, force);
        }
    }

    /**
     * Show or hide an element
     * @param {string} selector - CSS selector
     * @param {boolean} show - Whether to show or hide the element
     * @param {string} [display='block'] - Display value when showing
     */
    toggleElement(selector, show, display = 'block') {
        const element = this.getElement(selector);
        if (element) {
            element.style.display = show ? display : 'none';
            element.setAttribute('aria-hidden', String(!show));
        }
    }

    // Event Handling
    // =============

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Debounced window resize handler
        const handleResize = debounce(() => this.handleResize(), 250);
        window.addEventListener('resize', handleResize);

        // Handle clicks on the document for delegated event handling
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Handle document click for delegated events
     * @param {MouseEvent} e - Click event
     */
    handleDocumentClick(e) {
        // Example: Close dropdowns when clicking outside
        if (!e.target.closest('.dropdown') && !e.target.matches('.dropdown-toggle')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    }

    /**
     * Handle keyboard navigation
     * @param {KeyboardEvent} e - Keydown event
     */
    handleKeyDown(e) {
        // Close modals with Escape key
        if (e.key === 'Escape' && this.modals.size > 0) {
            const lastModal = Array.from(this.modals.values()).pop();
            lastModal.hide();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update responsive classes
        this.toggleClass('body', 'is-mobile', window.innerWidth < 768);
    }

    // Data Display
    // ============

    /**
     * Render a template with data
     * @param {string} template - HTML template string
     * @param {Object} data - Data to interpolate
     * @returns {string} Rendered HTML
     */
    renderTemplate(template, data = {}) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    /**
     * Update a data table with new data
     * @param {string} tableId - Table element ID
     * @param {Array} data - Array of row data
     * @param {Function} rowRenderer - Function that returns HTML for a row
     */
    updateDataTable(tableId, data, rowRenderer) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody') || table.createTBody();
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="100%" class="text-center">No data available</td>';
            tbody.appendChild(tr);
            return;
        }

        data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = rowRenderer(item, index);
            tbody.appendChild(tr);
        });
    }

    // Cleanup
    // =======

    /**
     * Clean up event listeners and references
     */
    destroy() {
        // Close all modals
        this.modals.forEach(modal => modal.hide());
        this.modals.clear();

        // Remove all notifications
        this.notifications.forEach(id => this.removeNotification(id));
        this.notifications.clear();

        // Remove any other event listeners
        // ...
    }
}

// Make UIManager available globally when loaded directly
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}