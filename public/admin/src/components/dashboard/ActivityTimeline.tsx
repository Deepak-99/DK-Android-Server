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
        <Card
            elevation={0}
            sx={{
                backgroundColor: "#11161c",
                border: "1px solid #1f2933",
                borderRadius: 3
            }}
        >
            <CardContent>
                <Typography
                    variant="h6"
                    mb={2}
                    sx={{ color: "#e6edf3" }}
                >
                    Activity Timeline
                </Typography>

                <Stack spacing={1.5}>
                    {locations.slice(0, 8).map((l: any) => (
                        <Box
                            key={l.id}
                            sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                                p: 1.5,
                                borderRadius: 2,
                                backgroundColor: "#0b0f14",
                                border: "1px solid #1f2933",
                                "&:hover": {
                                    borderColor: "#3b82f6"
                                }
                            }}
                        >
                            <Avatar sx={{ bgcolor: "#3b82f6" }}>
                                📍
                            </Avatar>

                            <Box flex={1}>
                                <Typography
                                    fontWeight={600}
                                    sx={{ color: "#e6edf3" }}
                                >
                                    {l.device?.name || l.deviceId}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    sx={{ color: "#9aa4af" }}
                                >
                                    Location update
                                </Typography>
                            </Box>

                            <Typography
                                variant="caption"
                                sx={{ color: "#9aa4af" }}
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