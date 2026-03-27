import { useState } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Grid
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";

import { useQuery } from "@tanstack/react-query";
import { getDeviceInfo } from "@/services/deviceSettings";

/* ================= TYPE ================= */

type DeviceInfo = {
  deviceId: string;
  name?: string;
  nickname?: string;
  model?: string;
  manufacturer?: string;
  os?: string;
  osVersion?: string;
  isOnline?: boolean;
  batteryLevel?: number | null;
  isCharging?: boolean;
  networkType?: string | null;
  lastSeen?: string | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  appVersion?: string | null;
};

/* ================= COMPONENT ================= */

export default function DeviceInfo() {
  const { id } = useParams();
  const [tab, setTab] = useState(0);

  const { data, isLoading, refetch } = useQuery<DeviceInfo>({
    queryKey: ["device-info", id],
    queryFn: () => getDeviceInfo(id!),
    enabled: !!id
  });

  const device = data;

  if (isLoading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (!device) return null;

  return (
    <Box>

      {/* ================= HEADER ================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >

            <Box>
              <Typography variant="h6">
                {device.name || "Unknown Device"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {device.manufacturer} • {device.model}
              </Typography>
            </Box>

            <Box display="flex" gap={2} alignItems="center">

              <Chip
                label={device.isOnline ? "Online" : "Offline"}
                color={device.isOnline ? "success" : "error"}
                size="small"
              />

              <Chip
                icon={<BatteryFullIcon />}
                label={`${device.batteryLevel ?? "--"}%`}
                variant="outlined"
              />

              <Chip
                icon={<NetworkCheckIcon />}
                label={device.networkType || "Unknown"}
                variant="outlined"
              />

            </Box>

          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>

            <Grid size={{ xs: 6, md: 3 }}>
              <Info label="Android" value={device.osVersion} />
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Info label="App Version" value={device.appVersion} />
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Info label="IP Address" value={device.ipAddress} />
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>
              <Info
                label="Last Seen"
                value={
                  device.lastSeen
                    ? new Date(device.lastSeen).toLocaleString()
                    : "--"
                }
              />
            </Grid>

          </Grid>

        </CardContent>
      </Card>

      {/* ================= HEADER BAR ================= */}

      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">
          Device Information
        </Typography>

        <Button
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Overview" />
        <Tab label="Hardware" />
      </Tabs>

      {/* ================= OVERVIEW ================= */}

      {tab === 0 && (
        <Grid container spacing={2} mt={1}>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>

                <Typography variant="h6">
                  Device Status
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Info label="Name" value={device.name} />
                <Info label="Model" value={device.model} />
                <Info label="Manufacturer" value={device.manufacturer} />
                <Info label="OS" value={device.os} />
                <Info label="OS Version" value={device.osVersion} />

              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>

                <Typography variant="h6">
                  System Info
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Info
                  label="Battery"
                  value={`${device.batteryLevel ?? "--"}%`}
                />

                <Info
                  label="Charging"
                  value={device.isCharging ? "Yes" : "No"}
                />

                <Info
                  label="Network"
                  value={device.networkType}
                />

                <Info
                  label="Last Seen"
                  value={
                    device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : "--"
                  }
                />

              </CardContent>
            </Card>
          </Grid>

        </Grid>
      )}

      {/* ================= HARDWARE ================= */}

      {tab === 1 && (
        <Grid container spacing={2} mt={1}>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>

                <Typography variant="h6">
                  Network
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Info label="Type" value={device.networkType} />
                <Info label="IP" value={device.ipAddress} />
                <Info label="MAC" value={device.macAddress} />

              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>

                <Typography variant="h6">
                  Battery
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Info
                  label="Level"
                  value={`${device.batteryLevel ?? "--"}%`}
                />

                <Info
                  label="Charging"
                  value={device.isCharging ? "Yes" : "No"}
                />

              </CardContent>
            </Card>
          </Grid>

        </Grid>
      )}

    </Box>
  );
}

/* ================= HELPER ================= */

function Info({ label, value }: any) {
  return (
    <Box mb={1}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body2">
        {value || "--"}
      </Typography>
    </Box>
  );
}