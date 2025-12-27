import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";

export default function HeatMap({ points }: any) {
    const data = points.map((p: any) => [
        p.latitude,
        p.longitude,
        0.5
    ]);

    return (
        <HeatmapLayer
            points={data}
            longitudeExtractor={(m: any) => m[1]}
            latitudeExtractor={(m: any) => m[0]}
            intensityExtractor={(m: any) => m[2]}
        />
    );
}
