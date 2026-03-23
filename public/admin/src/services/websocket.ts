type WSStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export let socket: WebSocket | null = null;

let reconnectAttempts = 0;
let reconnectTimer: number | null = null;

const listeners = new Set<(data: any) => void>();
const statusListeners = new Set<(s: WSStatus) => void>();

const MAX_DELAY = 30000;

/* -------------------------
   Build WS URL safely
------------------------- */
const getWSUrl = (): string | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const protocol = location.protocol === "https:" ? "wss" : "ws";

  return `${protocol}://localhost:3000/ws/command?token=${token}`;
};

const notify = (s: WSStatus) => {
  statusListeners.forEach((cb) => cb(s));
};

/* -------------------------
   CONNECT
------------------------- */
export function connect() {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const url = getWSUrl();
  if (!url) {
    console.warn("WS skipped — no token yet");
    return;
  }

  notify("connecting");

  socket = new WebSocket(url);

  socket.onopen = () => {
    reconnectAttempts = 0;
    notify("connected");
  };

  socket.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      listeners.forEach((cb) => cb(data));
    } catch (err) {
      console.warn("WS parse error", err);
    }
  };

  socket.onclose = () => {
    notify("disconnected");
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

/* -------------------------
   RECONNECT
------------------------- */
function scheduleReconnect() {
  if (reconnectTimer) return;

  const delay = Math.min(1000 * 2 ** reconnectAttempts++, MAX_DELAY);

  notify("reconnecting");

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

/* -------------------------
   DISCONNECT
------------------------- */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  reconnectTimer = null;

  socket?.close();
  socket = null;
}

/* -------------------------
   EMIT
------------------------- */
export function wsEmit(type: string, payload?: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({ type, payload }));
}

/* -------------------------
   SUBSCRIBE
------------------------- */
export function subscribe(cb: (data: any) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function subscribeStatus(cb: (s: WSStatus) => void) {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export function onStatusChange(cb: (s: WSStatus) => void) {
  return subscribeStatus(cb);
}

export function onEvent(type: string, cb: (data: any) => void) {
  return subscribe((data) => {
    if (data?.type === type) {
      cb(data.payload ?? data);
    }
  });
}