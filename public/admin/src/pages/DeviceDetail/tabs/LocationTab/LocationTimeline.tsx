import { Slider } from "@/components/ui/slider";

export default function LocationTimeline({ history }: { history: any[] }) {
    return (
        <div className="p-5 bg-card border border-border rounded-xl">
            <h3 className="font-semibold mb-3">Location History Timeline</h3>

            <Slider
                min={0}
                max={history.length - 1}
                defaultValue={[history.length - 1]}
            />

            <p className="text-sm text-text-dim mt-3">
                {history.length} location points collected
            </p>
        </div>
    );
}
