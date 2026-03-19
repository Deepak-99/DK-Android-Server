import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Switch,
    FormControlLabel,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    CardHeader,
} from '@mui/material';

import {
    Save as SaveIcon,
    Security as SecurityIcon,
    NetworkWifi as NetworkIcon,
    Storage as StorageIcon,
    Notifications as NotificationsIcon,
    PowerSettingsNew as PowerIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getDeviceSettings, updateDeviceSettings } from '../../../../services/settings';

/* ----------------------------------------
 * Types
 * --------------------------------------*/
type DeviceSettings = {
    autoUpdate: boolean;
    backupEnabled: boolean;
    powerSaving: boolean;
    notifications: boolean;
};

/* ----------------------------------------
 * Component
 * --------------------------------------*/
const Settings = () => {
    const { id: deviceId } = useParams<{ id: string }>();
    const { enqueueSnackbar } = useSnackbar();

    const [activeTab, setActiveTab] = useState(0);
    const [settings, setSettings] = useState<DeviceSettings>({
        autoUpdate: true,
        backupEnabled: false,
        powerSaving: false,
        notifications: true,
    });

    /* ----------------------------------------
     * Fetch settings (React Query v5)
     * --------------------------------------*/
    const {
        data,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['deviceSettings', deviceId],
        queryFn: () => getDeviceSettings(deviceId!),
        enabled: !!deviceId,
    });

    /* Sync fetched data into local state */
    useEffect(() => {
        if (data) {
            setSettings(data);
        }
    }, [data]);

    /* ----------------------------------------
     * Update settings mutation
     * --------------------------------------*/
    const updateMutation = useMutation({
        mutationFn: (newSettings: DeviceSettings) =>
            updateDeviceSettings(deviceId!, newSettings),
        onSuccess: () => {
            enqueueSnackbar('Settings saved', { variant: 'success' });
        },
        onError: () => {
            enqueueSnackbar('Failed to save settings', { variant: 'error' });
        },
    });

    /* ----------------------------------------
     * Handlers
     * --------------------------------------*/
    const handleToggle =
        (field: keyof DeviceSettings) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newSettings = {
                ...settings,
                [field]: event.target.checked,
            };

            setSettings(newSettings);
            updateMutation.mutate(newSettings);
        };

    /* ----------------------------------------
     * Loading / Error
     * --------------------------------------*/
    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">Failed to load settings</Alert>;
    }

    /* ----------------------------------------
     * UI
     * --------------------------------------*/
    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Device Settings
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                sx={{ mb: 3 }}
            >
                <Tab label="General" />
                <Tab label="Network" />
                <Tab label="Storage" />
                <Tab label="Security" />
                <Tab label="Notifications" />
            </Tabs>

            <Paper sx={{ p: 3 }}>
                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined">
                                <CardHeader
                                    avatar={<PowerIcon color="primary" />}
                                    title="Power Management"
                                />
                                <CardContent>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.powerSaving}
                                                onChange={handleToggle('powerSaving')}
                                            />
                                        }
                                        label="Power Saving Mode"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined">
                                <CardHeader title="System Updates" />
                                <CardContent>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={settings.autoUpdate}
                                                onChange={handleToggle('autoUpdate')}
                                            />
                                        }
                                        label="Enable Auto Updates"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}


                {activeTab !== 0 && (
                    <Typography color="text.secondary">
                        Settings for this section are coming soon.
                    </Typography>
                )}

                <Box mt={4} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => updateMutation.mutate(settings)}
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Settings;
