import { useEffect, useRef } from "react";

export default function ScreenCanvas({ frameRef }: any) {
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        let raf: number;

        function draw() {
            if (imgRef.current && frameRef.current) {
                imgRef.current.src = frameRef.current;
            }
            raf = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="flex-1 bg-black flex items-center justify-center">
            <img
                ref={imgRef}
                className="max-w-full max-h-full object-contain"
            />
        </div>
    );
}
