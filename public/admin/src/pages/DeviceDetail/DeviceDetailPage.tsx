import { useParams } from "react-router-dom";
import { useState } from "react";

import { useDeviceDetail } from "./useDeviceDetail";
import DeviceHeader from "./header/DeviceHeader";

import InfoTab from "./tabs/InfoTab";
import LocationTab from "./tabs/LocationTab/LocationTab";

import Commands from "../devices/[id]/features/Commands";
import Contacts from "../devices/[id]/features/Contacts";
import SMS from "../devices/[id]/features/SMS";
import CallLogs from "../devices/[id]/features/CallLogs";
import InstalledApps from "../devices/[id]/features/InstalledApps";
import FileExplorer from "../devices/[id]/features/FileExplorer";
import ScreenProjections from "../devices/[id]/features/ScreenProjections";

const tabs = [
  "info",
  "location",
  "commands",
  "contacts",
  "sms",
  "calls",
  "apps",
  "files",
  "screen"
];

export default function DeviceDetailPage() {

  const { id } = useParams();

  const { info, loading } = useDeviceDetail(id!);

  const [active,setActive] = useState("info");

  if (loading || !info) return null;

  return (
    <div className="space-y-4">

      <DeviceHeader device={info} />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 rounded-lg text-sm
            ${active===t
              ? "bg-accent text-white"
              : "bg-card border border-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
        {active==="info" && <InfoTab deviceId={info} />}

        {active==="location" && <LocationTab deviceId={info} />}

        {active==="commands" && <Commands deviceId={id!} />}

        {active==="contacts" && <Contacts />}

        {active==="sms" && <SMS />}

        {active==="calls" && <CallLogs />}

        {active==="apps" && <InstalledApps />}

        {active==="files" && <FileExplorer />}

        {active==="screen" && <ScreenProjections deviceId={id!} />}

    </div>
  );
}