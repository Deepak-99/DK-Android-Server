import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  Grid,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";

import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  LockReset as ResetPasswordIcon,
  Lock as LockIcon,
  History as HistoryIcon,
} from "@mui/icons-material";

import { format } from "date-fns";
import { User, UserRole } from "../../types/user";
import { userService } from "../../services/userService";
import { useSnackbar } from "notistack";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return <Box sx={{ p: 2 }}>{children}</Box>;
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const data = await userService.getUserById(String(id));
        setUser(data);
      } catch {
        enqueueSnackbar("Failed to load user", { variant: "error" });
        navigate("/users");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading || !user) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  const roleColor = (role: UserRole) =>
    role === "admin" ? "primary" : role === "manager" ? "secondary" : "default";

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate("/users")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h4">User Details</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>

          {/* LEFT PANEL */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box textAlign="center">
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: "auto",
                  mb: 2,
                  fontSize: "2.5rem"
                }}
              >
                {user.fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </Avatar>

              <Typography variant="h6">{user.fullName}</Typography>

              <Chip
                label={user.role}
                color={roleColor(user.role) as any}
                sx={{ mt: 1 }}
              />

              <Box mt={2}>
                <Button
                  fullWidth
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/users/edit/${user.id}`)}
                >
                  Edit
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* RIGHT PANEL */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)}>
              <Tab label="Overview" />
              <Tab label="Security" />
              <Tab label="Activity" />
            </Tabs>

            {/* OVERVIEW */}
            <TabPanel value={tab} index={0}>
              <Grid container spacing={2}>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary">Username</Typography>
                  <Typography>{user.username}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary">Email</Typography>
                  <Typography>{user.email}</Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary">Status</Typography>
                  <Typography>
                    {user.isActive ? "Active" : "Inactive"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary">Last Login</Typography>
                  <Typography>
                    {user.lastLogin
                      ? format(new Date(user.lastLogin), "PPpp")
                      : "Never"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary">Created</Typography>
                  <Typography>
                    {format(new Date(user.createdAt), "PP")}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary">Updated</Typography>
                  <Typography>
                    {format(new Date(user.updatedAt), "PPpp")}
                  </Typography>
                </Grid>

              </Grid>
            </TabPanel>

            {/* SECURITY */}
            <TabPanel value={tab} index={1}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="subtitle1">
                    Reset Password
                  </Typography>
                  <Typography color="text.secondary">
                    Set new password
                  </Typography>
                </Box>

                <Button startIcon={<ResetPasswordIcon />}>
                  Reset
                </Button>
              </Box>

              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1">
                    Two Factor Auth
                  </Typography>
                  <Typography color="text.secondary">
                    {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Typography>
                </Box>

                <Button startIcon={<LockIcon />} disabled>
                  Toggle
                </Button>
              </Box>
            </TabPanel>

            {/* ACTIVITY */}
            <TabPanel value={tab} index={2}>
              <Box display="flex" gap={2} alignItems="center">
                <HistoryIcon />

                <Box>
                  <Typography>
                    Last login{" "}
                    {user.lastLogin
                      ? format(new Date(user.lastLogin), "PPpp")
                      : "Never"}
                  </Typography>

                  <Typography color="text.secondary">
                    IP: {user.lastLoginIp || "Unknown"} •{" "}
                    {user.lastLoginUserAgent || "Unknown device"}
                  </Typography>
                </Box>
              </Box>
            </TabPanel>

          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
