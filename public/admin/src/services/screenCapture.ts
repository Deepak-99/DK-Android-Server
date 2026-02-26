import api from './api';


// -------------------------------
// Types
// -------------------------------

export interface ScreenCaptureStatus {
    session_id: string;
    resolution: string;
    fps: number;
    bitrate: number;
    status: 'starting' | 'active' | 'paused' | 'stopped' | 'error';
    viewer_count?: number;
}


// -------------------------------
// Start Projection
// -------------------------------

export const startScreenCapture = async (
    deviceId: string
): Promise<string> => {
    const res = await api.post(`/devices/${deviceId}/screen-projection/start`);
    return res.data.streamUrl;
};


// -------------------------------
// Stop Projection
// -------------------------------

export const stopScreenCapture = async (
    deviceId: string
): Promise<void> => {
    await api.post(`/devices/${deviceId}/screen-projection/stop`);
};


// -------------------------------
// Status
// -------------------------------

export const getScreenCaptureStatus = async (
    deviceId: string
): Promise<ScreenCaptureStatus> => {
    const res = await api.get(`/devices/${deviceId}/screen-projection/status`);
    return res.data;
};
