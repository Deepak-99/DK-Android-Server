import React from 'react';
import { Box, Typography, TextField, FormControlLabel, Switch, Button, Grid } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = React.useState({
    appName: 'DK-Hawkshaw',
    language: 'en',
    autoUpdate: true,
    darkMode: false,
    notifications: true,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Save settings logic here
    console.log('Saving settings:', settings);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        General Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Application Name"
            name="appName"
            value={settings.appName}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            select
            fullWidth
            label="Language"
            name="language"
            value={settings.language}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            SelectProps={{ native: true }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoUpdate}
                  onChange={handleChange}
                  name="autoUpdate"
                  color="primary"
                />
              }
              label="Automatic Updates"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleChange}
                  name="darkMode"
                  color="primary"
                />
              }
              label="Dark Mode"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={handleChange}
                  name="notifications"
                  color="primary"
                />
              }
              label="Enable Notifications"
            />
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default GeneralSettings;
