type Listener = (event: any) => void;

let socket: WebSocket | null = null;
const listeners: Listener[] = [];

export function connect() {
  if (socket) return;

  socket = new WebSocket("ws://localhost:3000");

  socket.onopen = () => {
    console.log("WS connected");
  };

  socket.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      listeners.forEach((l) => l(data));
    } catch (e) {
      console.error("WS parse error", e);
    }
  };

  socket.onclose = () => {
    console.warn("WS disconnected");
    socket = null;
    setTimeout(connect, 3000);
  };
}

export function disconnect() {
  socket?.close();
  socket = null;
}

export function subscribe(listener: Listener) {
  listeners.push(listener);

  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
}

/* alias for compatibility */
export function wsEmit(event: any) {
  socket?.send(JSON.stringify(event));
}

export function send(event: any) {
  wsEmit(event);
}