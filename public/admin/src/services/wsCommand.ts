export function createCommandWS(token: string) {

    return new WebSocket(
        `ws://${location.host}/ws/command?token=${token}`
    );
}
