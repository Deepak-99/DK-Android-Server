export function createStreamWS(token: string) {

    return new WebSocket(
        `ws://${location.host}/ws/stream?token=${token}`
    );
}
