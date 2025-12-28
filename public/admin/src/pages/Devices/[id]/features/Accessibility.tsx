import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Switch, FormControlLabel,
    Grid, Divider, Button, TextField, Select, MenuItem,
    InputLabel, FormControl, Slider, CircularProgress
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAccessibilitySettings, updateAccessibilitySettings } from '../../../services/accessibility';

const Accessibility = () => {
    const { id: deviceId } = useParams();
    const { enqueueSnackbar } = useSnackbar();
    const [settings, setSettings] = useState({
        screenReader: false,
        fontSize: 16,
        displaySize: 1,
        colorCorrection: 'default',
        touchAssistance: false,
        highContrast: false,
        textToSpeech: false,
    });

    const { isLoading, error } = useQuery(
        ['accessibility', deviceId],
        () => getAccessibilitySettings(deviceId!),
        {
            onSuccess: (data) => setSettings(data),
        }
    );

    const updateMutation = useMutation(
        (newSettings) => updateAccessibilitySettings(deviceId!, newSettings),
        {
            onSuccess: () => enqueueSnackbar('Settings updated', { variant: 'success' }),
            onError: () => enqueueSnackbar('Update failed', { variant: 'error' }),
        }
    );

    const handleChange = (field: string, value: any) => {
        const newSettings = { ...settings, [field]: value };
        setSettings(newSettings);
        updateMutation.mutate(newSettings);
    };

    if (isLoading) return <CircularProgress />;
    if (error) return <Typography color="error">Error loading settings</Typography>;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Accessibility Settings
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Display
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.screenReader}
                                    onChange={(e) => handleChange('screenReader', e.target.checked)}
                                />
                            }
                            label="Screen Reader"
                        />
                        {/* Add more display settings */}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Accessibility;