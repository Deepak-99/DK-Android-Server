// public/admin/js/modules/utils/helpers.js

/**
 * Format a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format a date to a human-readable string
 * @param {Date|string|number} date - Date to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeTime=true] - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, options = {}) {
    const {
        includeTime = true,
        locale = navigator.language || 'en-US'
    } = options;

    if (!date) return 'N/A';

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) return 'Invalid date';

    const dateOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    if (includeTime) {
        Object.assign(dateOptions, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    return dateObj.toLocaleString(locale, dateOptions);
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;

    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}

/**
 * Generate a unique ID
 * @param {string} [prefix=''] - Prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = '') {
    return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }

    return cloned;
}

/**
 * Check if a value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if the value is empty
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Convert an object to URL query parameters
 * @param {Object} params - Parameters object
 * @returns {string} URL-encoded query string
 */
export function toQueryString(params) {
    return Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
            if (Array.isArray(value)) {
                return value
                    .filter(v => v !== undefined && v !== null)
                    .map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
                    .join('&');
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .join('&');
}

/**
 * Parse a query string into an object
 * @param {string} queryString - Query string to parse
 * @returns {Object} Parsed query parameters
 */
export function parseQueryString(queryString) {
    return Object.fromEntries(
        new URLSearchParams(queryString).entries()
    );
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} [ellipsis='...'] - Ellipsis character(s) to append
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength, ellipsis = '...') {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + ellipsis;
}

/**
 * Generate a random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export function randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Check if a value is a valid email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if the email is valid
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Format a number with commas as thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

/**
 * Convert a string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} kebab-cased string
 */
export function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Convert a string to camelCase
 * @param {string} str - String to convert
 * @returns {string} camelCased string
 */
export function toCamelCase(str) {
    return str
        .replace(/^\w|[A-Z]|\b\w/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/[-\s]+/g, '');
}

// Export all functions as default for easier importing
export default {
    formatFileSize,
    formatDateTime,
    formatDuration,
    generateId,
    debounce,
    throttle,
    deepClone,
    isEmpty,
    toQueryString,
    parseQueryString,
    capitalize,
    truncate,
    randomString,
    isValidEmail,
    formatNumber,
    toKebabCase,
    toCamelCase
};