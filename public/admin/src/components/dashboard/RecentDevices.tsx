import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { getDashboardOverview } from "@/services/dashboard";

dayjs.extend(relativeTime);

export default function RecentDevices() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 30000
  });

  if (isLoading) return null;

  const devices = data?.recent_activity?.devices || [];

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Recent Devices
        </Typography>

        <Stack spacing={2}>
          {devices.map((d: any) => (
            <Box
              key={d.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 1.5,
                borderRadius: 2,
                bgcolor: "background.default"
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar>
                  {d.name?.charAt(0) || "D"}
                </Avatar>

                <Box>
                  <Typography fontWeight={600}>
                    {d.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {d.deviceId}
                  </Typography>
                </Box>
              </Box>

              <Box textAlign="right">
                <Chip
                  label={d.status}
                  color={d.status === "active" ? "success" : "default"}
                  size="small"
                  sx={{ mb: 0.5 }}
                />

                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  {d.lastSeen
                    ? dayjs(d.lastSeen).fromNow()
                    : "Never"}
                </Typography>

                {d.batteryLevel && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    🔋 {d.batteryLevel}%
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}