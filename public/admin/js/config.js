export const CONFIG = {
    api: {
        baseUrl: '/api',
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
    },
    websocket: {
        reconnectDelay: 1000,
        maxReconnectAttempts: 5,
    },
    ui: {
        notificationDuration: 5000,
        debounceTime: 300,
        throttleTime: 1000,
    }
};