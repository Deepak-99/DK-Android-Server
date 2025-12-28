import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Card, CardContent,
    Divider, Chip, CircularProgress, Button,
    List, ListItem, ListItemIcon, ListItemText,
    Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    Refresh, PhoneAndroid, Storage, Memory,
    Speed, DeveloperMode, Security, Build,
    BatteryChargingFull, Wifi, NetworkCell,
    SdStorage, Apps, DisplaySettings
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { getDeviceInfo } from '../../../services/deviceInfo';

const DeviceInfo = () => {
    const { id: deviceId } = useParams();
    const [activeTab, setActiveTab] = useState(0);
    const { enqueueSnackbar } = useSnackbar();

    const { data: device, isLoading, error, refetch } = useQuery(
        ['deviceInfo', deviceId],
        () => getDeviceInfo(deviceId!),
        {
            refetchOnWindowFocus: false,
        }
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const refreshData = async () => {
        try {
            await refetch();
            enqueueSnackbar('Device information refreshed', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to refresh device information', { variant: 'error' });
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !device) {
        return (
            <Box textAlign="center" p={4}>
                <Typography color="error">Failed to load device information</Typography>
                <Button
                    variant="outlined"
                    onClick={refreshData}
                    startIcon={<Refresh />}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    const renderStatusChip = (status: string) => {
        const statusMap: Record<string, { color: 'success' | 'warning' | 'error'; label: string }> = {
            online: { color: 'success', label: 'Online' },
            offline: { color: 'error', label: 'Offline' },
            busy: { color: 'warning', label: 'Busy' },
        };

        const statusInfo = statusMap[status.toLowerCase()] || { color: 'default', label: status };

        return (
            <Chip
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
            />
        );
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Device Information</Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={refreshData}
                    disabled={isLoading}
                >
                    Refresh
                </Button>
            </Box>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Overview" />
                <Tab label="Hardware" />
                <Tab label="Software" />
                <Tab label="Battery" />
                <Tab label="Network" />
                <Tab label="Storage" />
            </Tabs>

            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
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
                                            secondary={device.deviceName || 'N/A'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Build />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Status"
                                            secondary={renderStatusChip(device.status)}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Speed />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Uptime"
                                            secondary={device.uptime || 'N/A'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Security />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Security"
                                            secondary={device.securityPatchLevel || 'N/A'}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    System Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">Manufacturer</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.manufacturer || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">Model</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.model || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">Android Version</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.androidVersion || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">API Level</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.apiLevel || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">Kernel Version</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.kernelVersion || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2">Build Number</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.buildNumber || 'N/A'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Hardware Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <Memory sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Memory
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Type</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="right">Used</TableCell>
                                                <TableCell align="right">Free</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>RAM</TableCell>
                                                <TableCell align="right">
                                                    {(device.memory?.total / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                </TableCell>
                                                <TableCell align="right">
                                                    {(device.memory?.used / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                </TableCell>
                                                <TableCell align="right">
                                                    {(device.memory?.free / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <Storage sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Storage
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Type</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="right">Used</TableCell>
                                                <TableCell align="right">Free</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {device.storage?.map((storage: any, index: number) => (
                                                <TableRow key={index}>
                                                    <TableCell>{storage.type}</TableCell>
                                                    <TableCell align="right">
                                                        {(storage.total / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {(storage.used / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {(storage.free / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    <DisplaySettings sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Display
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="subtitle2">Resolution</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.display?.resolution || 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="subtitle2">Density</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.display?.density || 'N/A'} dpi
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="subtitle2">Refresh Rate</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.display?.refreshRate || 'N/A'} Hz
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Typography variant="subtitle2">Size</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {device.display?.size || 'N/A'}"
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Add other tabs content for Software, Battery, Network, Storage */}

        </Box>
    );
};

export default DeviceInfo;