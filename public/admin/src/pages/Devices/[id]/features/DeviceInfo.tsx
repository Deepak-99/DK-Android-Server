import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

import {
  Refresh,
  PhoneAndroid,
  Storage,
  Memory,
  Speed,
  Security,
  Build,
  DisplaySettings
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';

import {
  getDeviceInfo,
  DeviceInfo as DeviceInfoType
} from '../../../../services/deviceSettings';

const DeviceInfo = () => {
  const { id: deviceId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { enqueueSnackbar } = useSnackbar();

  /* ---------------- REACT QUERY V5 ---------------- */

  const {
    data: device,
    isLoading,
    isError,
    refetch
  } = useQuery<DeviceInfoType>({
    queryKey: ['deviceInfo', deviceId],

    queryFn: () => getDeviceInfo(deviceId!),

    enabled: !!deviceId,

    refetchOnWindowFocus: false
  });

  /* ---------------- HANDLERS ---------------- */

  const refreshData = async () => {
    try {
      await refetch();
      enqueueSnackbar('Device information refreshed', {
        variant: 'success'
      });
    } catch {
      enqueueSnackbar('Failed to refresh device information', {
        variant: 'error'
      });
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, value: number) => {
    setActiveTab(value);
  };

  /* ---------------- LOADING / ERROR ---------------- */

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !device) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error">
          Failed to load device information
        </Typography>

        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          onClick={refreshData}
          startIcon={<Refresh />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  /* ---------------- STATUS CHIP ---------------- */

  const renderStatusChip = (status: string) => {
    const map: Record<string, any> = {
      online: { color: 'success', label: 'Online' },
      offline: { color: 'error', label: 'Offline' },
      busy: { color: 'warning', label: 'Busy' }
    };

    const item = map[status?.toLowerCase()] || {
      color: 'default',
      label: status
    };

    return <Chip size="small" label={item.label} color={item.color} />;
  };

  /* ---------------- UI ---------------- */

  return (
    <Box>

      {/* HEADER */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">
          Device Information
        </Typography>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refreshData}
        >
          Refresh
        </Button>
      </Box>

      {/* TABS */}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" />
        <Tab label="Hardware" />
      </Tabs>

      {/* ================= OVERVIEW TAB ================= */}

      {activeTab === 0 && (

        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
          gap={3}
        >

          {/* STATUS CARD */}

          <Card>
            <CardContent>

              <Typography variant="h6" gutterBottom>
                Device Status
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <List>

                <ListItem>
                  <ListItemIcon>
                    <PhoneAndroid />
                  </ListItemIcon>

                  <ListItemText
                    primary="Device Name"
                    secondary={device.name}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Build />
                  </ListItemIcon>

                  <ListItemText
                    primary="Status"
                    secondary={renderStatusChip('online')}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Speed />
                  </ListItemIcon>

                  <ListItemText
                    primary="Android Version"
                    secondary={device.androidVersion}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>

                  <ListItemText
                    primary="Security Patch"
                    secondary={device.securityPatch}
                  />
                </ListItem>

              </List>

            </CardContent>
          </Card>

          {/* SYSTEM CARD */}

          <Card>
            <CardContent>

              <Typography variant="h6" gutterBottom>
                System Info
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr"
                gap={2}
              >

                <Box>
                  <Typography variant="subtitle2">Manufacturer</Typography>
                  <Typography variant="body2">
                    {device.manufacturer}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2">Model</Typography>
                  <Typography variant="body2">
                    {device.model}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2">API Level</Typography>
                  <Typography variant="body2">
                    {device.apiLevel}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2">Build</Typography>
                  <Typography variant="body2">
                    {device.buildNumber}
                  </Typography>
                </Box>

              </Box>

            </CardContent>
          </Card>

        </Box>
      )}

      {/* ================= HARDWARE TAB ================= */}

      {activeTab === 1 && (

        <Card>
          <CardContent>

            <Typography variant="h6" gutterBottom>
              Hardware Information
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box
              display="grid"
              gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
              gap={3}
            >

              {/* MEMORY */}

              <Box>

                <Typography variant="subtitle1" gutterBottom>
                  <Memory sx={{ mr: 1 }} />
                  Memory
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell>Available</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      <TableRow>
                        <TableCell>
                          {(device.memory.total / 1e9).toFixed(2)} GB
                        </TableCell>
                        <TableCell>
                          {(device.memory.available / 1e9).toFixed(2)} GB
                        </TableCell>
                      </TableRow>
                    </TableBody>

                  </Table>
                </TableContainer>

              </Box>

              {/* STORAGE */}

              <Box>

                <Typography variant="subtitle1" gutterBottom>
                  <Storage sx={{ mr: 1 }} />
                  Storage
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">

                    <TableHead>
                      <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell>Used</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      <TableRow>
                        <TableCell>
                          {(device.storage.internal.total / 1e9).toFixed(2)} GB
                        </TableCell>
                        <TableCell>
                          {(device.storage.internal.used / 1e9).toFixed(2)} GB
                        </TableCell>
                      </TableRow>
                    </TableBody>

                  </Table>
                </TableContainer>

              </Box>

            </Box>

          </CardContent>
        </Card>
      )}

    </Box>
  );
};

export default DeviceInfo;
