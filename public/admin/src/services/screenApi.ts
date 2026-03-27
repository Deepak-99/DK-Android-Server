import { send } from "./websocket";

export const screenApi = {

    start(deviceId: string) {
        send({
            type: "screen_start",
            deviceId
        });
    },

    stop(deviceId: string) {
        send({
            type: "screen_stop",
            deviceId
        });
    }

};