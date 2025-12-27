// services/EventNormalizer.js
const {
    AppLog,
    AccessibilityData,
    Location,
    SMS,
    NormalizedEvent
} = require('../models');

const WebSocketService = require('./WebSocketService');

class EventNormalizer {

    static async normalizeAppLog(log) {
        return {
            device_id: log.device_id,
            type: 'app_usage',
            app: log.package_name,
            signal: 'active',
            confidence: 0.9,
            timestamp: log.timestamp,
            meta: { duration: log.duration || null }
        };
    }

    static async normalizeAccessibility(data) {
        return {
            device_id: data.device_id,
            type: 'notification',
            app: data.package_name,
            signal: data.category || 'unknown',
            confidence: 0.6,
            timestamp: data.timestamp,
            meta: null
        };
    }

    static async normalizeSocialSignal(signal) {
        return {
            device_id: signal.device_id,
            type: 'social_signal',
            app: signal.platform,
            signal: signal.signal,
            confidence: signal.confidence ?? 0.7,
            timestamp: signal.timestamp,
            meta: signal.meta ?? {}
        };
    }

    static async ingest(event) {
        // Deduplication rule (last 3 seconds)
        const exists = await NormalizedEvent.findOne({
            where: {
                device_id: event.device_id,
                type: event.type,
                app: event.app,
                timestamp: { $gt: event.timestamp - 3000 }
            }
        });

        if (exists) return;

        const saved = await NormalizedEvent.create(event);

        // 🔥 Broadcast live
        WebSocketService.broadcast('normalized_event', saved);

        return saved;
    }
}

module.exports = EventNormalizer;
