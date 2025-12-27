import { useState } from "react";
import { useCommands } from "./useCommands";
import CommandTypeSelector from "./CommandTypeSelector";
import CommandForm from "./CommandForm";
import CommandHistory from "./CommandHistory";
import { COMMAND_PRESETS } from "./commandPresets";
import CommandList from "./CommandList";
import CommandCreator from "./CommandCreator";
import CommandOutput from "./CommandOutput";
import ScreenshotViewer from "./ScreenshotViewer";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function CommandsPage({ deviceId }: { deviceId: string }) {
    const { list,history, loading, send, reload } = useCommands(deviceId);
    const [selected, setSelected] = useState<any>(null);
    const [currentType, setCurrentType] = useState<string | null>(null);
    const [params, setParams] = useState<any>({});
    const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

    function choose(type: string, defaultParams: any) {
        setCurrentType(type);
        setParams(defaultParams);
    }

    function updateParam(k: string, v: any) {
        setParams({ ...params, [k]: v });
    }
    useWebSocket("screenshot.new", (payload: { device_id: string; url: string }) => {
        if (payload.device_id === deviceId) {
            setScreenshotUrl(payload.url);
        }
    });

    async function submit() {
        if (!currentType) return;
        await send(currentType as any, params);
    }

    if (loading) return <div className="p-6">Loading commands…</div>;

    return (

        <div className="flex h-full">
            <div className="flex flex-col h-full">
                <CommandCreator deviceId={deviceId} />
                <CommandList list={list} onSelect={setSelected} />
            </div>

            <CommandOutput cmd={selected} />

            {screenshotUrl && (
                <ScreenshotViewer url={screenshotUrl} onClose={() => setScreenshotUrl(null)} />
            )}
        </div>
    );

        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold">Remote Commands</h1>

            {!currentType && (
                <CommandTypeSelector onSelect={choose} />
            )}

            {currentType && (
                <CommandForm
                    params={params}
                    onChange={updateParam}
                    onSend={submit}
                />
            )}

            <h2 className="text-xl font-semibold mt-10">Command History</h2>

            {loading ? <div>Loading…</div> : <CommandHistory history={history} />}
        </div>
    );
}
