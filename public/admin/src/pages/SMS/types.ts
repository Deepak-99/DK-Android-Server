export interface SMSMessage {
    id: number;
    device_id: string;
    thread_id: string;
    address: string;
    body: string;
    date: number;
    type: number; // 1 = received, 2 = sent
    read: number;
}

export interface SMSConversation {
    thread_id: string;
    address: string;
    contact_name?: string;
    last_message: string;
    last_date: number;
    timestamp: number;
    unread: number;
    unread_count: number;
}

export interface SMSStats {
    total: number;
    sent: number;
    received: number;
    unread: number;
}
