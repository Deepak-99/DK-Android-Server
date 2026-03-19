import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import { getDashboardStats } from "../../services/dashboard";

import LoadingSkeleton from "../../components/common/LoadingSkeleton";
import StatCard from "../../components/dashboard/StatCard";
import RecentDevices from "../../components/dashboard/RecentDevices";
import ActivityTimeline from "../../components/dashboard/ActivityTimeline";

const Dashboard = () => {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Box>
        <LoadingSkeleton type="text" width="30%" height={48} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(4, 1fr)",
            },
            gap: 3,
            mt: 2,
          }}
        >
          {[1, 2, 3, 4].map((item) => (
            <LoadingSkeleton key={item} type="card" height={120} />
          ))}
        </Box>
      </Box>
    );
  }

  if (isError || !stats) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="error">
          Failed to load dashboard data
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        <StatCard title="Devices" value={stats.devices} />
        <StatCard title="Online" value={stats.online} />
        <StatCard title="Alerts" value={stats.alerts} />
        <StatCard title="Commands" value={stats.commands} />
      </Box>

      {/* Lower Widgets */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 3,
          mt: 3,
        }}
      >
        <RecentDevices />
        <ActivityTimeline />
      </Box>
    </Box>
  );
};

export default Dashboard;
