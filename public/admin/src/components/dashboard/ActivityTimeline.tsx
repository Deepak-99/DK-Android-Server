import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { getDashboardOverview } from "@/services/dashboard";

dayjs.extend(relativeTime);

export default function ActivityTimeline() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: getDashboardOverview,
    refetchInterval: 15000
  });

  if (isLoading) return null;

  const locations = data?.recent_activity?.locations || [];

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" mb={2}>
          Activity Timeline
        </Typography>

        <Stack spacing={2}>
          {locations.slice(0, 8).map((l: any) => (
            <Box
              key={l.id}
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                p: 1.5,
                borderRadius: 2,
                bgcolor: "background.default"
              }}
            >
              <Avatar sx={{ bgcolor: "primary.main" }}>
                📍
              </Avatar>

              <Box flex={1}>
                <Typography fontWeight={600}>
                  {l.device?.name || l.deviceId}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Location update
                </Typography>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {dayjs(l.timestamp).fromNow()}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}