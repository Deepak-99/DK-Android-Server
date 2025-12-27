export default function InfoTab({ deviceId }: { deviceId: string }) {
    const { info } = useDeviceDetail(deviceId);

    if (!info) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div className="p-5 bg-card border border-border rounded-xl">
                <h3 className="font-semibold mb-3">Device Info</h3>
                <div className="text-text-dim text-sm space-y-1">
                    <div>Model: {info.model}</div>
                    <div>Manufacturer: {info.manufacturer}</div>
                    <div>Android: {info.android_version}</div>
                    <div>App Version: {info.app_version}</div>
                </div>
            </div>

            <div className="p-5 bg-card border border-border rounded-xl">
                <h3 className="font-semibold mb-3">System</h3>
                <div className="text-text-dim text-sm space-y-1">
                    <div>Battery: {info.battery}%</div>
                    <div>Storage: {info.storage_used} / {info.storage_total}</div>
                    <div>RAM: {info.ram_used} / {info.ram_total}</div>
                </div>
            </div>
        </div>
    );
}
