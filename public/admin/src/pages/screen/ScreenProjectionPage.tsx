import ScreenCanvas from "./ScreenCanvas";
import ScreenControls from "./ScreenControls";
import { useScreenStream } from "./useScreenStream";

export default function ScreenProjectionPage({ deviceId }: any) {
    const screen = useScreenStream(deviceId);

    return (
        <div className="flex flex-col h-full">
            <ScreenControls {...screen} />
            <ScreenCanvas frameRef={screen.frameRef} />
        </div>
    );
}
