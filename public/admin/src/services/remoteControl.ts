import { wsEmit } from "./websocket"

export function sendText(deviceId: string, text: string) {

    wsEmit("keyboard", {
        deviceId,
        text
    })
}
