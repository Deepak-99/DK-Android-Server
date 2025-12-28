import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, Switch, FormControlLabel,
    TextField, Divider, CircularProgress, Alert, Snackbar,
    Tabs, Tab, Grid, Card, CardContent, CardHeader, Avatar
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
import { getDeviceSettings, updateDeviceSettings } from '../../../services/settings';

const Settings = () => {
    const { id: deviceId } = useParams();
    const [activeTab, setActiveTab] = useState(0);
    const [settings, setSettings] = useState({
        autoUpdate: true,
        backupEnabled: false,
        powerSaving: false,
        notifications: true,
        // Add more settings as needed
    });
    const { enqueueSnackbar } = useSnackbar();

    const { isLoading, error } = useQuery(
        ['deviceSettings', deviceId],
        () => getDeviceSettings(deviceId!),
        {
            onSuccess: (data) => setSettings(data),
        }
    );

    const updateMutation = useMutation(
        (newSettings) => updateDeviceSettings(deviceId!, newSettings),
        {
            onSuccess: () => {
                enqueueSnackbar('Settings saved', { variant: 'success' });
            },
            onError: () => {
                enqueueSnackbar('Failed to save settings', { variant: 'error' });
            },
        }
    );

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const newSettings = { ...settings, [field]: event.target.checked };
        setSettings(newSettings);
        updateMutation.mutate(newSettings);
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Alert severity="error">Error loading settings</Alert>;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Device Settings
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
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
                        <Grid item xs={12} md={6}>
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
                                                onChange={handleChange('powerSaving')}
                                            />
                                        }
                                        label="Power Saving Mode"
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                        {/* Add more settings cards */}
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Network Settings
                        </Typography>
                        {/* Network settings content */}
                    </Box>
                )}

                {/* Add other tabs content */}

                <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => updateMutation.mutate(settings)}
                        disabled={updateMutation.isLoading}
                    >
                        {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Settings;