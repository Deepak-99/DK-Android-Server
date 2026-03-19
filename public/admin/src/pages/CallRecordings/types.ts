export interface CallRecording {
    id: number;

    deviceId: string;
    callId: number;

    phoneNumber: string;
    contactName?: string;

    duration: number;

    fileSize: number;
    mime: string;

    status?: string;

    createdAt: string;
}
