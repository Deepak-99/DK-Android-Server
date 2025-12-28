import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, CircularProgress,
    Card, CardContent, Divider, IconButton, Tooltip
} from '@mui/material';
import { Refresh, MyLocation, History } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { getDeviceLocation, getLocationHistory } from '../../../services/location';

const Location = () => {
    const { id: deviceId } = useParams();
    const [showHistory, setShowHistory] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    const {
        data: location,
        isLoading,
        refetch
    } = useQuery(
        ['location', deviceId],
        () => getDeviceLocation(deviceId!),
        { refetchInterval: 30000 } // Refresh every 30 seconds
    );

    const { data: locationHistory = [] } = useQuery(
        ['locationHistory', deviceId],
        () => getLocationHistory(deviceId!),
        { enabled: showHistory }
    );

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Device Location</Typography>
                <Box>
                    <Button
                        startIcon={<Refresh />}
                        onClick={() => refetch()}
                        disabled={isLoading}
                        sx={{ mr: 1 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        startIcon={<History />}
                        onClick={() => setShowHistory(!showHistory)}
                        color={showHistory ? 'primary' : 'inherit'}
                        variant={showHistory ? 'contained' : 'outlined'}
                    >
                        {showHistory ? 'Hide History' : 'View History'}
                    </Button>
                </Box>
            </Box>

            {isLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : location ? (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ height: '500px', overflow: 'hidden' }}>
                            <MapContainer
                                center={[location.latitude, location.longitude]}
                                zoom={13}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <Marker position={[location.latitude, location.longitude]}>
                                    <Popup>
                                        <div>
                                            <div><strong>Device:</strong> {deviceId}</div>
                                            <div><strong>Accuracy:</strong> {location.accuracy}m</div>
                                            <div><strong>Time:</strong> {new Date(location.timestamp).toLocaleString()}</div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Location Details
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Typography>
                                    <strong>Latitude:</strong> {location.latitude.toFixed(6)}
                                </Typography>
                                <Typography>
                                    <strong>Longitude:</strong> {location.longitude.toFixed(6)}
                                </Typography>
                                <Typography>
                                    <strong>Accuracy:</strong> {location.accuracy} meters
                                </Typography>
                                <Typography>
                                    <strong>Last Updated:</strong> {new Date(location.timestamp).toLocaleString()}
                                </Typography>
                                {location.address && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle2">Address</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {location.address}
                                        </Typography>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            ) : (
                <Typography>No location data available</Typography>
            )}
        </Box>
    );
};

export default Location;