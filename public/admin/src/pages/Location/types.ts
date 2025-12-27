export interface LocationPoint {
    id: number;
    device_id: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    altitude?: number;
    timestamp: number;
}

export interface LocationStats {
    total_points: number;
    first_seen: number;
    last_seen: number;
}
