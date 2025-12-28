import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, TextField,
    Divider, Grid, Card, CardContent, CardHeader,
    Switch, FormControlLabel, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Alert
} from '@mui/material';
import { Save, Refresh, Add, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    getConfigurations,
    saveConfiguration,
    deleteConfiguration
} from '../../../services/configuration';

const DynamicConfigurations = () => {
    const { id: deviceId } = useParams();
    const [activeTab, setActiveTab] = useState('app');
    const [newConfig, setNewConfig] = useState({
        key: '',
        value: '',
        type: 'string',
        description: ''
    });
    const [configs, setConfigs] = useState<Array<{
        id: string;
        key: string;
        value: any;
        type: string;
        description: string;
    }>>([]);

    const { enqueueSnackbar } = useSnackbar();

    const { isLoading, error, refetch } = useQuery(
        ['configurations', deviceId, activeTab],
        () => getConfigurations(deviceId!, activeTab),
        {
            onSuccess: (data) => setConfigs(data),
        }
    );

    const saveMutation = useMutation(
        (config: any) => saveConfiguration(deviceId!, activeTab, config),
        {
            onSuccess: () => {
                refetch();
                enqueueSnackbar('Configuration saved', { variant: 'success' });
            },
        }
    );

    const deleteMutation = useMutation(
        (configId: string) => deleteConfiguration(deviceId!, activeTab, configId),
        {
            onSuccess: () => {
                refetch();
                enqueueSnackbar('Configuration deleted', { variant: 'success' });
            },
        }
    );

    const handleAddConfig = () => {
        if (!newConfig.key || !newConfig.value) {
            enqueueSnackbar('Key and value are required', { variant: 'warning' });
            return;
        }

        saveMutation.mutate(newConfig);
        setNewConfig({ key: '', value: '', type: 'string', description: '' });
    };

    const handleUpdateConfig = (index: number, field: string, value: any) => {
        const updatedConfigs = [...configs];
        updatedConfigs[index] = { ...updatedConfigs[index], [field]: value };
        setConfigs(updatedConfigs);
        saveMutation.mutate(updatedConfigs[index]);
    };

    const handleDeleteConfig = (configId: string) => {
        if (window.confirm('Are you sure you want to delete this configuration?')) {
            deleteMutation.mutate(configId);
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Dynamic Configurations</Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    Refresh
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" gap={2} mb={3}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Configuration Type</InputLabel>
                        <Select
                            value={activeTab}
                            label="Configuration Type"
                            onChange={(e) => setActiveTab(e.target.value as string)}
                        >
                            <MenuItem value="app">Application</MenuItem>
                            <MenuItem value="device">Device</MenuItem>
                            <MenuItem value="network">Network</MenuItem>
                            <MenuItem value="security">Security</MenuItem>
                            <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" gutterBottom>
                    Add New Configuration
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Key"
                            fullWidth
                            value={newConfig.key}
                            onChange={(e) => setNewConfig({ ...newConfig, key: e.target.value })}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Value"
                            fullWidth
                            value={newConfig.value}
                            onChange={(e) => setNewConfig({ ...newConfig, value: e.target.value })}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={newConfig.type}
                                label="Type"
                                onChange={(e) => setNewConfig({ ...newConfig, type: e.target.value })}
                            >
                                <MenuItem value="string">String</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="boolean">Boolean</MenuItem>
                                <MenuItem value="json">JSON</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Description"
                            fullWidth
                            value={newConfig.description}
                            onChange={(e) =>
                                setNewConfig({ ...newConfig, description: e.target.value })
                            }
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={1} display="flex" alignItems="center">
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAddConfig}
                            fullWidth
                            disabled={!newConfig.key || !newConfig.value}
                        >
                            Add
                        </Button>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    Current Configurations
                </Typography>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error">Failed to load configurations</Alert>
                ) : configs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                        No configurations found
                    </Typography>
                ) : (
                    <Grid container spacing={2}>
                        {configs.map((config, index) => (
                            <Grid item xs={12} key={config.id}>
                                <Card variant="outlined">
                                    <CardHeader
                                        title={config.key}
                                        subheader={config.description}
                                        action={
                                            <IconButton
                                                onClick={() => handleDeleteConfig(config.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <Delete />
                                            </IconButton>
                                        }
                                    />
                                    <CardContent>
                                        {config.type === 'boolean' ? (
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={config.value === 'true' || config.value === true}
                                                        onChange={(e) =>
                                                            handleUpdateConfig(
                                                                index,
                                                                'value',
                                                                e.target.checked.toString()
                                                            )
                                                        }
                                                    />
                                                }
                                                label={config.value === 'true' || config.value === true ? 'Enabled' : 'Disabled'}
                                            />
                                        ) : (
                                            <TextField
                                                fullWidth
                                                value={config.value}
                                                onChange={(e) =>
                                                    handleUpdateConfig(index, 'value', e.target.value)
                                                }
                                                size="small"
                                                type={config.type === 'number' ? 'number' : 'text'}
                                                multiline={config.type === 'json'}
                                                minRows={config.type === 'json' ? 3 : 1}
                                            />
                                        )}
                                        <Box mt={1}>
                                            <Typography variant="caption" color="text.secondary">
                                                Type: {config.type}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>
        </Box>
    );
};

export default DynamicConfigurations;