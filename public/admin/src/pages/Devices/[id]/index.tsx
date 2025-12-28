import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getDeviceById } from '../../../services/devices';
import CallRecordings from './features/CallRecordings';
import Commands from './features/Commands';
import DeviceInfo from './features/DeviceInfo';
// Import other feature components...

const DeviceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const { data: device, isLoading } = useQuery(
    ['device', id],
    () => getDeviceById(id!),
    { enabled: !!id }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return <div>Loading device details...</div>;
  }

  if (!device) {
    return <div>Device not found</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {device.name} ({device.model})
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Device Info" />
          <Tab label="Call Recordings" />
          <Tab label="Commands" />
          <Tab label="Call Logs" />
          <Tab label="Screenshots" />
          <Tab label="Location" />
          {/* Add more tabs for other features */}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && <DeviceInfo device={device} />}
        {activeTab === 1 && <CallRecordings deviceId={device.id} />}
        {activeTab === 2 && <Commands deviceId={device.id} />}
        {/* Add more tab panels for other features */}
      </Box>
    </Box>
  );
};

export default DeviceDetails;