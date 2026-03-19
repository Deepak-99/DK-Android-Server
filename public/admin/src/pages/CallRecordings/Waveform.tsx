import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

export default function Waveform({ url }: { url: string }) {

  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<any>(null);

  useEffect(() => {

    if (!containerRef.current) return;

    // Destroy previous instance
    if (waveRef.current) {
      waveRef.current.destroy();
      waveRef.current = null;
    }

    const wave = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#888",
      progressColor: "#1976d2",
      height: 90,
      barWidth: 2,
      normalize: true
    });

    wave.load(url);
    waveRef.current = wave;

    return () => {
      wave.destroy();
    };

  }, [url]);

  return <div ref={containerRef} />;
}
