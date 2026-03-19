import { useEffect, useRef } from "react";
import {
    connectStream,
    disconnectStream,
    onFrame
} from "../../services/streamSocket";

interface Props {
    deviceId: string;
}

export default function StreamViewer({ deviceId }: Props) {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(new Image());

    useEffect(() => {

        connectStream(deviceId);

        const unsubscribe = onFrame((data: ArrayBuffer) => {

            const blob = new Blob([data], { type: "image/jpeg" });

            const url = URL.createObjectURL(blob);

            const img = imgRef.current;

            img.onload = () => {

                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                canvas.width = img.width;
                canvas.height = img.height;

                ctx.drawImage(img, 0, 0);

                URL.revokeObjectURL(url);
            };

            img.src = url;
        });

        return () => {

            unsubscribe();
            disconnectStream();
        };

    }, [deviceId]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                background: "black"
            }}
        />
    );
}