import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Tabs, Tab, Paper, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getDeviceById, Device } from "../../../services/devices";

import DeviceInfo from "./features/DeviceInfo";
import CallRecordings from "./features/CallRecordings";
import Commands from "./features/Commands";
import ScreenProjections from "./features/ScreenProjections";
import LocationPage from "../../../pages/Location/LocationPage";
import ScreenRecordingsPage from "../../../pages/screen-recordings/ScreenRecordingsPage";

const DeviceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  /* ✅ React Query v5 syntax + typing */

  const { data: device, isLoading } = useQuery<Device>({
    queryKey: ["device", id],
    queryFn: () => getDeviceById(id!),
    enabled: !!id
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 🧠 Clean Tab Architecture
  const TABS = useMemo(() => {
    if (!device) return [];

    return [
      {
        key: "info",
        label: "Device Info",
        component: <DeviceInfo />
      },
      {
        key: "call-recordings",
        label: "Call Recordings",
        component: <CallRecordings />
      },
      {
        key: "screen-recordings",
        label: "Screen Recordings",
        component: <ScreenRecordingsPage deviceId={device.id} />
      },
      {
        key: "projection",
        label: "Screen Projection",
        component: <ScreenProjections />
      },
      {
        key: "commands",
        label: "Commands",
        component: <Commands />
      },
      {
        key: "location",
        label: "Location",
        component: <LocationPage deviceId={device.id} />
      }
    ];
  }, [device]);

  if (isLoading) {
    return <div>Loading device details...</div>;
  }

  if (!device) {
    return <div>Device not found</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {device.name} ({device.model})
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2, minHeight: 600 }}>
        {TABS[activeTab]?.component}
      </Box>
    </Box>
  );
};

export default DeviceDetails;
