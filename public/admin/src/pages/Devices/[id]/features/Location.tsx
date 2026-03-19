import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';

import { Refresh, History } from '@mui/icons-material';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';

import {
  getCurrentLocation,
  getLocationHistory,
  type LocationPoint
} from '../../../../services/location';


// ------------------------------------------------------

const Location = () => {

  const { id: deviceId } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [showHistory, setShowHistory] = useState(false);


  // ---------------- CURRENT LOCATION ----------------

  const {
    data: location,
    isLoading,
    isError,
    refetch
  } = useQuery<LocationPoint | null>({

    queryKey: ['location', deviceId],

    queryFn: () => getCurrentLocation(deviceId!),

    enabled: !!deviceId,

    refetchInterval: 30000 // 30 sec live refresh
  });


  // ---------------- LOCATION HISTORY ----------------

  const {
    data: history = []
  } = useQuery<LocationPoint[]>({

    queryKey: ['locationHistory', deviceId],

    queryFn: () => getLocationHistory(deviceId!),

    enabled: showHistory && !!deviceId
  });


  // ---------------- UI ----------------

  if (isError) {
    enqueueSnackbar('Failed to load location', { variant: 'error' });
  }


  return (

    <Box>

      {/* Header */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >

        <Typography variant="h5">
          Device Location
        </Typography>

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
            variant={showHistory ? 'contained' : 'outlined'}
          >
            {showHistory ? 'Hide History' : 'View History'}
          </Button>

        </Box>

      </Box>


      {/* Loading */}

      {isLoading && (

        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>

      )}


      {/* No Data */}

      {!isLoading && !location && (

        <Typography color="text.secondary">
          No location data available
        </Typography>

      )}


      {/* Main Content */}

      {!isLoading && location && (

        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }}
          gap={3}
        >

          {/* MAP */}

          <Paper sx={{ height: 500 }}>

            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker
                position={[location.latitude, location.longitude]}
              >

                <Popup>

                  <div>
                    <div>
                      <strong>Device:</strong> {deviceId}
                    </div>

                    {location.accuracy && (
                      <div>
                        <strong>Accuracy:</strong> {location.accuracy} m
                      </div>
                    )}

                    <div>
                      <strong>Time:</strong>{' '}
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                  </div>

                </Popup>

              </Marker>

            </MapContainer>

          </Paper>


          {/* INFO CARD */}

          <Card>

            <CardContent>

              <Typography variant="h6" gutterBottom>
                Location Details
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Typography>
                <strong>Latitude:</strong>{' '}
                {location.latitude.toFixed(6)}
              </Typography>

              <Typography>
                <strong>Longitude:</strong>{' '}
                {location.longitude.toFixed(6)}
              </Typography>

              {location.accuracy && (
                <Typography>
                  <strong>Accuracy:</strong> {location.accuracy} meters
                </Typography>
              )}

              <Typography>
                <strong>Last Updated:</strong>{' '}
                {new Date(location.timestamp).toLocaleString()}
              </Typography>

            </CardContent>

          </Card>

        </Box>

      )}

    </Box>
  );
};

export default Location;
