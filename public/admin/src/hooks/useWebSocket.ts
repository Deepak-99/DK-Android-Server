import { useEffect } from "react";
import { subscribe } from "../services/websocket";

type Callback<T = any> = (payload: T) => void;

export function useWebSocket<T = any>(
    eventType: string,
    callback: Callback<T>
) {

    useEffect(() => {

        const unsubscribe = subscribe((data) => {
            if (data?.type === eventType) {
                callback(data.payload);
            }
        });

        return () => {
            unsubscribe();
        };

    }, [eventType]);
}
