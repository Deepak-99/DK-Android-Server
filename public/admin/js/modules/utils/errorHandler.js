/**
 * Global error handler
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 * @param {Object} [ui] - Optional UI manager instance for showing notifications
 */
export function handleError(context, error, ui = null) {
    console.error(`${context}:`, error);

    if (ui) {
        const message = error.message || 'An unexpected error occurred';
        ui.showNotification(message, 'error');
    }

    // You can add more sophisticated error handling here
    // like sending error reports to a monitoring service
}

/**
 * Error boundary for async functions
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} [options] - Options
 * @param {Function} [options.onError] - Custom error handler
 * @param {Object} [options.context] - Context to bind to the function
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorBoundary(asyncFn, { onError, context } = {}) {
    return async function(...args) {
        try {
            return await asyncFn.apply(context || this, args);
        } catch (error) {
            if (onError) {
                onError(error);
            } else {
                handleError('Error in async function', error, context?.ui);
            }
            throw error;
        }
    };
}