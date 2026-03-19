let socket: WebSocket | null = null
let frameListeners = new Set<(data: ArrayBuffer) => void>()

export function connectStream(deviceId: string) {

    const token = localStorage.getItem("token")

    const protocol =
        location.protocol === "https:" ? "wss" : "ws"

    const url =
        `${protocol}://${location.host}/ws/stream?token=${token}&deviceId=${deviceId}`

    socket = new WebSocket(url)

    socket.binaryType = "arraybuffer"

    socket.onmessage = e => {

        if (e.data instanceof ArrayBuffer) {

            frameListeners.forEach(cb =>
                cb(e.data)
            )
        }
    }
}

export function disconnectStream() {

    socket?.close()
    socket = null
}

export function onFrame(cb: (data: ArrayBuffer) => void) {

    frameListeners.add(cb)

    return () => frameListeners.delete(cb)
}
