import api from './api';

export interface LocationPoint {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    bearing?: number;
    timestamp: string;
    provider?: string;
    batteryLevel?: number;
    isFromMockProvider?: boolean;
    altitudeAccuracy?: number;
    speedAccuracy?: number;
    bearingAccuracy?: number;
    locationType?: 'gps' | 'network' | 'fused' | 'passive';
}

export interface Geofence {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    transitionTypes: number[];
    notification: {
        title: string;
        text: string;
        icon?: string;
        color?: string;
    };
    loiteringDelay?: number;
    expirationDuration?: number;
    lastTriggered?: string;
    isActive: boolean;
}

export interface LocationHistoryFilter {
    startDate?: string;
    endDate?: string;
    minAccuracy?: number;
    maxPoints?: number;
    minDistance?: number;
    minTime?: number;
    provider?: string;
}

export interface LocationStats {
    totalPoints: number;
    firstPoint: LocationPoint;
    lastPoint: LocationPoint;
    totalDistance: number; // in meters
    averageSpeed: number; // in m/s
    maxSpeed: number; // in m/s
    timeSpentMoving: number; // in seconds
    timeSpentStationary: number; // in seconds
    byHour: Array<{ hour: number; count: number }>;
    byDay: Array<{ day: string; count: number }>;
    byProvider: Array<{ provider: string; count: number }>;
    places: Array<{
        latitude: number;
        longitude: number;
        count: number;
        lastVisited: string;
    }>;
}

export const getCurrentLocation = async (
    deviceId: string
): Promise<LocationPoint> => {
    const response = await api.get(`/devices/${deviceId}/location/current`);
    return response.data;
};

export const getLocationHistory = async (
    deviceId: string,
    filter?: LocationHistoryFilter
): Promise<LocationPoint[]> => {
    const response = await api.get(`/devices/${deviceId}/location/history`, {
        params: filter,
    });
    return response.data;
};

export const getLocationStats = async (
    deviceId: string,
    filter?: Omit<LocationHistoryFilter, 'maxPoints' | 'minDistance' | 'minTime'>
): Promise<LocationStats> => {
    const response = await api.get(`/devices/${deviceId}/location/stats`, {
        params: filter,
    });
    return response.data;
};

export const startLocationTracking = async (
    deviceId: string,
    options?: {
        interval?: number;
        fastestInterval?: number;
        priority?: 'balanced' | 'high_accuracy' | 'low_power' | 'no_power';
        maxWaitTime?: number;
        smallestDisplacement?: number;
        notificationTitle?: string;
        notificationText?: string;
    }
): Promise<void> => {
    await api.post(`/devices/${deviceId}/location/start-tracking`, options);
};

export const stopLocationTracking = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/location/stop-tracking`);
};

export const getTrackingStatus = async (
    deviceId: string
): Promise<{
    isTracking: boolean;
    lastUpdate?: string;
    settings: any;
}> => {
    const response = await api.get(`/devices/${deviceId}/location/tracking-status`);
    return response.data;
};

export const addGeofence = async (
    deviceId: string,
    geofence: Omit<Geofence, 'id' | 'lastTriggered'>
): Promise<Geofence> => {
    const response = await api.post(`/devices/${deviceId}/location/geofences`, geofence);
    return response.data;
};

export const getGeofences = async (deviceId: string): Promise<Geofence[]> => {
    const response = await api.get(`/devices/${deviceId}/location/geofences`);
    return response.data;
};

export const updateGeofence = async (
    deviceId: string,
    geofenceId: string,
    updates: Partial<Geofence>
): Promise<Geofence> => {
    const response = await api.patch(
        `/devices/${deviceId}/location/geofences/${geofenceId}`,
        updates
    );
    return response.data;
};

export const removeGeofence = async (
    deviceId: string,
    geofenceId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/location/geofences/${geofenceId}`);
};

export const getLastKnownLocation = async (
    deviceId: string
): Promise<LocationPoint | null> => {
    const response = await api.get(`/devices/${deviceId}/location/last-known`);
    return response.data;
};

export const getAddressFromCoordinates = async (
    deviceId: string,
    latitude: number,
    longitude: number
): Promise<{
    address: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    featureName?: string;
    phone?: string;
    url?: string;
}> => {
    const response = await api.get(`/devices/${deviceId}/location/reverse-geocode`, {
        params: { latitude, longitude },
    });
    return response.data;
};

export const getCoordinatesFromAddress = async (
    deviceId: string,
    address: string
): Promise<Array<{
    latitude: number;
    longitude: number;
    address: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
}>> => {
    const response = await api.get(`/devices/${deviceId}/location/geocode`, {
        params: { address },
    });
    return response.data;
};

export const exportLocationHistory = async (
    deviceId: string,
    format: 'gpx' | 'kml' | 'geojson' | 'csv' = 'gpx',
    filter?: LocationHistoryFilter
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/location/export`, {
        params: { ...filter, format },
        responseType: 'blob',
    });
    return response.data;
};

export const clearLocationHistory = async (
    deviceId: string,
    beforeDate?: string
): Promise<{ deleted: number }> => {
    const response = await api.delete(`/devices/${deviceId}/location/history`, {
        params: { beforeDate },
    });
    return response.data;
};