import { Smartphone, Wifi, Map, Activity } from "lucide-react";
import StatTile from "./StatTile";

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted text-sm">
          Overview of connected devices and activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatTile icon={<Smartphone />} label="Devices" value="12" />
        <StatTile icon={<Wifi />} label="Online" value="8" />
        <StatTile icon={<Map />} label="Locations" value="4" />
        <StatTile icon={<Activity />} label="Commands" value="32" />
      </div>

    </div>
  );
}