import { useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Tabs, Tab } from "@mui/material";

import DashboardLayout from "../../layouts/DashboardLayout";
import DeviceHeader from "./header/DeviceHeader";

// Existing feature pages
import InfoTab from "./tabs/InfoTab";
import LocationTab from "./tabs/LocationTab/LocationTab";

import FileExplorer from "../Devices/[id]/features/FileExplorer";
import Commands from "../Devices/[id]/features/Commands";
import SMS from "../Devices/[id]/features/SMS";
import Contacts from "../Devices/[id]/features/Contacts";
import InstalledApps from "../Devices/[id]/features/InstalledApps";
import CallLogs from "../Devices/[id]/features/CallLogs";

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);

  if (!id) return null;

  return (
    <DashboardLayout>
      <DeviceHeader deviceId={id} />

      {/* Tabs Header */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Info" />
          <Tab label="Location" />
          <Tab label="Files" />
          <Tab label="Commands" />
          <Tab label="SMS" />
          <Tab label="Contacts" />
          <Tab label="Apps" />
          <Tab label="Logs" />
        </Tabs>
      </Box>

      {/* Tab Content */}
        <Box sx={{ mt: 2 }}>

            {tab === 0 && <InfoTab deviceId={id} />}

            {tab === 1 && <LocationTab deviceId={id} />}

            {tab === 2 && <FileExplorer />}

            {tab === 3 && <Commands />}

            {tab === 4 && <SMS />}

            {tab === 5 && <Contacts />}

            {tab === 6 && <InstalledApps />}

            {tab === 7 && <CallLogs />}

        </Box>


    </DashboardLayout>
  );
}
