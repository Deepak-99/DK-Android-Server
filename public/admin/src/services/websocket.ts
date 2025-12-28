import { io, Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private static instance: WebSocketService;

    private constructor() {
        this.socket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:3000', {
            auth: {
                token: localStorage.getItem('token'),
            },
            autoConnect: false,
        });
    }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public connect() {
        if (!this.socket?.connected) {
            this.socket?.connect();
        }
    }

    public disconnect() {
        if (this.socket?.connected) {
            this.socket.disconnect();
        }
    }

    public on(event: string, callback: (...args: any[]) => void) {
        this.socket?.on(event, callback);
        return () => this.socket?.off(event, callback);
    }

    public off(event: string, callback?: (...args: any[]) => void) {
        this.socket?.off(event, callback);
    }

    public emit(event: string, ...args: any[]) {
        this.socket?.emit(event, ...args);
    }
}

export const socket = WebSocketService.getInstance();