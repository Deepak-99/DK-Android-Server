import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TabPanel, a11yProps } from '@/components/common/TabPanel';
import GeneralSettings from './sections/GeneralSettings';
import NotificationSettings from './sections/NotificationSettings';
import SecuritySettings from './sections/SecuritySettings';
import ThemeSettings from './sections/ThemeSettings';
import AboutSection from './sections/AboutSection';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTabs-flexContainer': {
              bgcolor: theme.palette.background.paper,
            },
          }}
        >
          <Tab label="General" {...a11yProps(0)} />
          <Tab label="Notifications" {...a11yProps(1)} />
          <Tab label="Security" {...a11yProps(2)} />
          <Tab label="Appearance" {...a11yProps(3)} />
          <Tab label="About" {...a11yProps(4)} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <GeneralSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <NotificationSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <SecuritySettings />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <ThemeSettings />
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            <AboutSection />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
