import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Waveform({ url }: { url: string }) {
    const container = useRef<HTMLDivElement>(null);
    const wave = useRef<any>(null);

    useEffect(() => {
        if (!container.current) return;

        wave.current = WaveSurfer.create({
            container: container.current,
            waveColor: "#555",
            progressColor: "#fff",
            height: 90,
            barWidth: 2,
        });

        wave.current.load(url);

        return () => wave.current.destroy();
    }, [url]);

    return <div ref={container} />;
}
