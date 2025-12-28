import api from './api';

export interface CameraDevice {
    id: string;
    facing: 'front' | 'back' | 'external';
    position?: number;
    hasFlash: boolean;
    flashModes: FlashMode[];
    supportedPictureSizes: Size[];
    supportedPreviewSizes: Size[];
    supportedVideoSizes: Size[];
    supportedFpsRanges: [number, number][];
    horizontalViewAngle?: number;
    verticalViewAngle?: number;
    maxZoom: number;
    zoomRatios: number[];
    isZoomSupported: boolean;
    isSmoothZoomSupported: boolean;
    maxNumDetectedFaces?: number;
    isAutoExposureLockSupported: boolean;
    isAutoWhiteBalanceLockSupported: boolean;
    isVideoStabilizationSupported: boolean;
    isVideoSnapshotSupported: boolean;
    isVideoStabilizationSupportedForMode?: (mode: string) => boolean;
    isMeteringAreaSupported: boolean;
    isFocusAreaSupported: boolean;
    isAutoExposureLockable: boolean;
    isAutoWhiteBalanceLockable: boolean;
    isZoomSupportedForMode?: (mode: string) => boolean;
    isVideoStabilizationSupportedForResolution?: (width: number, height: number) => boolean;
    isVideoSnapshotSupportedForMode?: (mode: string) => boolean;
    isVideoStabilizationSupportedForFpsRange?: (minFps: number, maxFps: number) => boolean;
}

export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface MeteringRectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
    weight: number;
}

export type FlashMode = 'off' | 'on' | 'auto' | 'torch' | 'red-eye';
export type FocusMode = 'auto' | 'fixed' | 'edof' | 'macro' | 'continuous-picture' | 'continuous-video' | 'infinity';
export type SceneMode = 'auto' | 'action' | 'portrait' | 'landscape' | 'night' | 'night-portrait' | 'theatre' | 'beach' | 'snow' | 'sunset' | 'steadyphoto' | 'fireworks' | 'sports' | 'party' | 'candlelight' | 'barcode';
export type WhiteBalance = 'auto' | 'incandescent' | 'fluorescent' | 'warm-fluorescent' | 'daylight' | 'cloudy-daylight' | 'twilight' | 'shade';
export type ColorEffect = 'none' | 'mono' | 'negative' | 'solarize' | 'sepia' | 'posterize' | 'whiteboard' | 'blackboard' | 'aqua';
export type AntiBandingMode = 'off' | '50hz' | '60hz' | 'auto';

export interface CameraSettings {
    flashMode?: FlashMode;
    focusMode?: FocusMode;
    whiteBalance?: WhiteBalance;
    exposureCompensation?: number;
    zoom?: number;
    autoExposureLock?: boolean;
    autoWhiteBalanceLock?: boolean;
    videoStabilizationEnabled?: boolean;
    videoStabilizationMode?: 'off' | 'on' | 'preview' | 'high_quality';
    videoStabilizationStrength?: 'low' | 'medium' | 'high' | 'maximum';
    focusDistance?: number;
    focusPoint?: Point;
    exposurePoint?: Point;
    exposureDuration?: number;
    iso?: number;
    jpegQuality?: number;
    jpegThumbnailSize?: Size;
    jpegThumbnailQuality?: number;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAltitude?: number;
    gpsTimestamp?: number;
    gpsProcessingMethod?: string;
    rotation?: number;
    orientation?: number;
    jpegOrientation?: number;
    videoSize?: Size;
    previewSize?: Size;
    pictureSize?: Size;
    recordingHint?: boolean;
    videoCodec?: 'h263' | 'h264' | 'm4v' | 'mp4' | 'webm' | 'vp8' | 'vp9' | 'hevc' | 'av1';
    audioCodec?: 'aac' | 'aac-eld' | 'amr-nb' | 'amr-wb' | 'he-aac' | 'vorbis';
    outputFormat?: 'default' | 'yuv420p' | 'yuv420sp' | 'yuv422i-yuyv' | 'rgb-565' | 'jpeg' | 'nv21' | 'yuv420-888' | 'raw10' | 'raw12' | 'raw-sensor' | 'private' | 'y8' | 'yuv-raw' | 'yuv-raw10' | 'yuv-raw12' | 'yuv-raw-10bit' | 'yuv-raw-12bit' | 'yuv-raw-16bit' | 'yuv-raw-20bit' | 'yuv-raw-24bit' | 'yuv-raw-32bit' | 'yuv-raw-48bit' | 'yuv-raw-64bit' | 'yuv-raw-float' | 'yuv-raw-double' | 'yuv-raw-half' | 'yuv-raw-10bit-compressed' | 'yuv-raw-12bit-compressed' | 'yuv-raw-16bit-compressed' | 'yuv-raw-20bit-compressed' | 'yuv-raw-24bit-compressed' | 'yuv-raw-32bit-compressed' | 'yuv-raw-48bit-compressed' | 'yuv-raw-64bit-compressed' | 'yuv-raw-float-compressed' | 'yuv-raw-double-compressed' | 'yuv-raw-half-compressed';

}

export interface CameraPhoto {
    uri: string;
    width: number;
    height: number;
    base64?: string;
    exif?: {
        [key: string]: any;
    };
    pictureOrientation?: number;
    deviceOrientation?: number;
}

export interface CameraRecording {
    uri: string;
    duration: number;
    size: number;
    codec?: string;
    width?: number;
    height?: number;
    bitrate?: number;
}

export interface FaceDetectionResult {
    faces: {
        bounds: {
            left: number;
            top: number;
            right: number;
            bottom: number;
            width: number;
            height: number;
            centerX: number;
            centerY: number;
        };
        score: number;
        id: number;
        leftEyeOpenProbability?: number;
        rightEyeOpenProbability?: number;
        smilingProbability?: number;
        landmarks?: {
            leftEye: Point;
            rightEye: Point;
            mouthLeft: Point;
            mouthRight: Point;
            noseBase: Point;
            leftCheek: Point;
            rightCheek: Point;
            leftEar: Point;
            rightEar: Point;
            leftEarTip: Point;
            rightEarTip: Point;
            leftEyeBrow: Point;
            rightEyeBrow: Point;
            mouthBottom: Point;
            leftMouth: Point;
            rightMouth: Point;
            leftPupil: Point;
            rightPupil: Point;
        };
    }[];
    image: {
        width: number;
        height: number;
    };
}

/**
 * Get list of available cameras
 */
export const getAvailableCameras = async (deviceId: string): Promise<CameraDevice[]> => {
    const response = await api.get(`/devices/${deviceId}/camera/devices`);
    return response.data;
};

/**
 * Get camera capabilities
 */
export const getCameraCapabilities = async (
    deviceId: string,
    cameraId: string
): Promise<CameraDevice> => {
    const response = await api.get(`/devices/${deviceId}/camera/${cameraId}/capabilities`);
    return response.data;
};

/**
 * Start camera preview
 */
export const startPreview = async (
    deviceId: string,
    cameraId: string,
    settings: Partial<CameraSettings> = {}
): Promise<{ streamId: string }> => {
    const response = await api.post(`/devices/${deviceId}/camera/${cameraId}/preview/start`, {
        ...settings,
    });
    return response.data;
};

/**
 * Stop camera preview
 */
export const stopPreview = async (deviceId: string, cameraId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/preview/stop`);
};

/**
 * Take a photo
 */
export const takePicture = async (
    deviceId: string,
    cameraId: string,
    options: {
        quality?: number;
        skipProcessing?: boolean;
        exif?: boolean;
        base64?: boolean;
        width?: number;
        height?: number;
    } = {}
): Promise<CameraPhoto> => {
    const response = await api.post(`/devices/${deviceId}/camera/${cameraId}/take-picture`, options);
    return response.data;
};

/**
 * Start video recording
 */
export const startRecording = async (
    deviceId: string,
    cameraId: string,
    options: {
        quality?: '480p' | '720p' | '1080p' | '2160p' | 'max';
        maxDuration?: number;
        maxFileSize?: number;
        mute?: boolean;
        mirrorVideo?: boolean;
        videoBitrate?: number;
        audioBitrate?: number;
        audioChannels?: number;
        audioSampleRate?: number;
        audioCodec?: string;
        videoCodec?: string;
        outputFormat?: string;
    } = {}
): Promise<{ recordingId: string }> => {
    const response = await api.post(`/devices/${deviceId}/camera/${cameraId}/recording/start`, options);
    return response.data;
};

/**
 * Stop video recording
 */
export const stopRecording = async (
    deviceId: string,
    cameraId: string
): Promise<CameraRecording> => {
    const response = await api.post(`/devices/${deviceId}/camera/${cameraId}/recording/stop`);
    return response.data;
};

/**
 * Get current camera settings
 */
export const getCameraSettings = async (
    deviceId: string,
    cameraId: string
): Promise<CameraSettings> => {
    const response = await api.get(`/devices/${deviceId}/camera/${cameraId}/settings`);
    return response.data;
};

/**
 * Update camera settings
 */
export const updateCameraSettings = async (
    deviceId: string,
    cameraId: string,
    settings: Partial<CameraSettings>
): Promise<CameraSettings> => {
    const response = await api.patch(`/devices/${deviceId}/camera/${cameraId}/settings`, settings);
    return response.data;
};

/**
 * Set focus point
 */
export const setFocusPoint = async (
    deviceId: string,
    cameraId: string,
    point: Point
): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/focus-point`, point);
};

/**
 * Set zoom level
 */
export const setZoom = async (
    deviceId: string,
    cameraId: string,
    zoom: number
): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/zoom`, { zoom });
};

/**
 * Toggle flash mode
 */
export const setFlashMode = async (
    deviceId: string,
    cameraId: string,
    mode: FlashMode
): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/flash`, { mode });
};

/**
 * Detect faces in the current frame
 */
export const detectFaces = async (
    deviceId: string,
    cameraId: string,
    options: {
        landmarkMode?: 'all' | 'none';
        classificationMode?: 'all' | 'none';
        performanceMode?: 'fast' | 'accurate';
        minFaceSize?: number;
        trackingEnabled?: boolean;
    } = {}
): Promise<FaceDetectionResult> => {
    const response = await api.post(`/devices/${deviceId}/camera/${cameraId}/detect-faces`, options);
    return response.data;
};

/**
 * Get supported scene modes
 */
export const getSupportedSceneModes = async (
    deviceId: string,
    cameraId: string
): Promise<SceneMode[]> => {
    const response = await api.get(`/devices/${deviceId}/camera/${cameraId}/scene-modes`);
    return response.data;
};

/**
 * Set scene mode
 */
export const setSceneMode = async (
    deviceId: string,
    cameraId: string,
    mode: SceneMode
): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/scene-mode`, { mode });
};

/**
 * Get supported color effects
 */
export const getSupportedColorEffects = async (
    deviceId: string,
    cameraId: string
): Promise<ColorEffect[]> => {
    const response = await api.get(`/devices/${deviceId}/camera/${cameraId}/color-effects`);
    return response.data;
};

/**
 * Set color effect
 */
export const setColorEffect = async (
    deviceId: string,
    cameraId: string,
    effect: ColorEffect
): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/color-effect`, { effect });
};

/**
 * Get supported anti-banding modes
 */
export const getSupportedAntiBandingModes = async (
    deviceId: string,
    cameraId: string
): Promise<AntiBandingMode[]> => {
    const response = await api.get(`/devices/${deviceId}/camera/${cameraId}/anti-banding-modes`);
    return response.data;
};

/**
 * Set anti-banding mode
 */
export const setAntiBandingMode = async (
    deviceId: string,
    cameraId: string,
    mode: AntiBandingMode
): Promise<void> => {
    await api.post(`/devices/${deviceId}/camera/${cameraId}/anti-banding`, { mode });
};

export default {
    // Camera Management
    getAvailableCameras,
    getCameraCapabilities,

    // Preview
    startPreview,
    stopPreview,

    // Capture
    takePicture,
    startRecording,
    stopRecording,

    // Settings
    getCameraSettings,
    updateCameraSettings,
    setFocusPoint,
    setZoom,
    setFlashMode,

    // Advanced Features
    detectFaces,

    // Scene Modes
    getSupportedSceneModes,
    setSceneMode,

    // Color Effects
    getSupportedColorEffects,
    setColorEffect,

    // Anti-banding
    getSupportedAntiBandingModes,
    setAntiBandingMode,
};