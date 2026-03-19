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

const getWSUrl = () => {

  const protocol =
    location.protocol === "https:" ? "wss" : "ws";

  const token =
    localStorage.getItem("token");

  return `${protocol}://${location.host}/ws/command?token=${token}`;
};

const notify = (s: WSStatus) => {

  statusListeners.forEach(cb => cb(s));
};

export function connect() {

  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  )
    return;

  notify("connecting");

  socket = new WebSocket(getWSUrl());

  socket.onopen = () => {

    reconnectAttempts = 0;

    notify("connected");
  };

  socket.onmessage = e => {

    try {

      const data = JSON.parse(e.data);

      listeners.forEach(cb => cb(data));

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

function scheduleReconnect() {

  if (reconnectTimer) return;

  const delay = Math.min(
    1000 * 2 ** reconnectAttempts++,
    MAX_DELAY
  );

  notify("reconnecting");

  reconnectTimer = window.setTimeout(() => {

    reconnectTimer = null;

    connect();

  }, delay);
}

export function disconnect() {

  reconnectTimer &&
    clearTimeout(reconnectTimer);

  reconnectTimer = null;

  socket?.close();

  socket = null;
}

export function wsEmit(
  type: string,
  payload?: any
) {

  if (!socket || socket.readyState !== WebSocket.OPEN)
    return;

  socket.send(
    JSON.stringify({ type, payload })
  );
}

export function subscribe(
  cb: (data: any) => void
) {

  listeners.add(cb);

  return () => listeners.delete(cb);
}

export function subscribeStatus(
  cb: (s: WSStatus) => void
) {

  statusListeners.add(cb);

  return () => statusListeners.delete(cb);
}
