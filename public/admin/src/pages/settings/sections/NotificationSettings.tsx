import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormGroup,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  Chip,
  Grid,
  Slider,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  NotificationsActive as NotificationsActiveIcon,
  VolumeUp as VolumeUpIcon,
  Vibration as VibrationIcon,
  PriorityHigh as PriorityHighIcon
} from '@mui/icons-material';

type NotificationType = 'system' | 'email' | 'sms' | 'push' | 'browser';

type NotificationPreference = {
  id: string;
  type: NotificationType;
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  priority: 'low' | 'medium' | 'high';
  email?: string;
  phone?: string;
};

const NotificationSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: '1',
      type: 'system',
      enabled: true,
      sound: true,
      vibrate: false,
      priority: 'medium',
    },
    {
      id: '2',
      type: 'email',
      enabled: true,
      sound: false,
      vibrate: false,
      priority: 'medium',
      email: 'user@example.com'
    },
    {
      id: '3',
      type: 'push',
      enabled: true,
      sound: true,
      vibrate: true,
      priority: 'high'
    },
  ]);

  const [newEmail, setNewEmail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(70);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(60); // in minutes

  const handleToggle = (id: string, field: keyof NotificationPreference) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id ? { ...pref, [field]: !pref[field] } : pref
      )
    );
  };

  const handlePriorityChange = (id: string, event: SelectChangeEvent<string>) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.id === id 
          ? { ...pref, priority: event.target.value as 'low' | 'medium' | 'high' } 
          : pref
      )
    );
  };

  const handleAddEmail = () => {
    if (newEmail && !preferences.some(p => p.email === newEmail)) {
      const newPref: NotificationPreference = {
        id: Date.now().toString(),
        type: 'email',
        enabled: true,
        sound: false,
        vibrate: false,
        priority: 'medium',
        email: newEmail
      };
      setPreferences([...preferences, newPref]);
      setNewEmail('');
    }
  };

  const handleRemove = (id: string) => {
    setPreferences(preferences.filter(pref => pref.id !== id));
  };

  const handleEdit = (id: string) => {
    setEditingId(editingId === id ? null : id);
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
  };

  const handleSnoozeChange = (_: Event, newValue: number | number[]) => {
    setSnoozeDuration(newValue as number);
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'system': return 'System Notifications';
      case 'email': return 'Email Notifications';
      case 'sms': return 'SMS Notifications';
      case 'push': return 'Push Notifications';
      case 'browser': return 'Browser Notifications';
      default: return type;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'system': return <NotificationsIcon />;
      case 'email': return <EmailIcon />;
      case 'sms': return <SmsIcon />;
      case 'push': return <NotificationsActiveIcon />;
      case 'browser': return <NotificationsActiveIcon />;
      default: return <NotificationsIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <NotificationsIcon sx={{ mr: 1 }} />
        Notification Preferences
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <VolumeUpIcon sx={{ mr: 1 }} />
          Sound & Alert Settings
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Typography id="volume-slider" gutterBottom>
              Notification Volume
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <VolumeUpIcon color="action" />
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                aria-labelledby="volume-slider"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography id="snooze-slider" gutterBottom>
              Snooze Notifications
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <NotificationsIcon color="action" />
              <Slider
                value={snoozeDuration}
                onChange={handleSnoozeChange}
                aria-labelledby="snooze-slider"
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} min`}
                step={15}
                min={15}
                max={240}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationsActiveIcon sx={{ mr: 1 }} />
            Notification Channels
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => {
              // Open dialog to add new notification channel
            }}
          >
            Add Channel
          </Button>
        </Box>
        
        <List>
          {preferences.map((pref) => (
            <React.Fragment key={pref.id}>
              <ListItem>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {getTypeIcon(pref.type)}
                </Box>
                <ListItemText
                  primary={getTypeLabel(pref.type)}
                  secondary={
                    pref.email 
                      ? `Sending to: ${pref.email}`
                      : `Priority: ${pref.priority}`
                  }
                />
                <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {pref.type === 'email' && (
                    <>
                      {editingId === pref.id ? (
                        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                          <TextField
                            size="small"
                            value={pref.email}
                            onChange={(e) => {
                              setPreferences(prev =>
                                prev.map(p =>
                                  p.id === pref.id 
                                    ? { ...p, email: e.target.value }
                                    : p
                                )
                              );
                            }}
                            sx={{ width: 200 }}
                          />
                          <Button 
                            size="small" 
                            onClick={() => setEditingId(null)}
                            variant="outlined"
                          >
                            Save
                          </Button>
                        </Box>
                      ) : (
                        <Chip 
                          label={pref.email} 
                          variant="outlined" 
                          size="small"
                          sx={{ mr: 2 }}
                        />
                      )}
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEdit(pref.id)}
                        title="Edit email"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  
                  <FormControl size="small" sx={{ minWidth: 100, mr: 2 }}>
                    <Select
                      value={pref.priority}
                      onChange={(e) => handlePriorityChange(pref.id, e)}
                      displayEmpty
                      size="small"
                      sx={{ height: 32 }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Tooltip title="Sound">
                    <IconButton
                      onClick={() => handleToggle(pref.id, 'sound')}
                      color={pref.sound ? 'primary' : 'default'}
                      size="small"
                    >
                      <VolumeUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Vibrate">
                    <IconButton
                      onClick={() => handleToggle(pref.id, 'vibrate')}
                      color={pref.vibrate ? 'primary' : 'default'}
                      size="small"
                    >
                      <VibrationIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={pref.enabled}
                        onChange={() => handleToggle(pref.id, 'enabled')}
                        color="primary"
                        size="small"
                      />
                    }
                    label={pref.enabled ? 'On' : 'Off'}
                    labelPlacement="start"
                    sx={{ m: 0, ml: 1 }}
                  />
                  
                  {pref.type !== 'system' && (
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemove(pref.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Add email for notifications"
            variant="outlined"
            size="small"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            type="email"
            sx={{ flexGrow: 1, maxWidth: 400 }}
          />
          <Button 
            variant="contained" 
            onClick={handleAddEmail}
            disabled={!newEmail}
            startIcon={<AddIcon />}
          >
            Add Email
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <PriorityHighIcon sx={{ mr: 1 }} />
          Critical Alerts
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                defaultChecked
                color="primary"
              />
            }
            label="Critical system alerts"
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                defaultChecked
                color="primary"
              />
            }
            label="Security notifications"
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                defaultChecked
                color="primary"
              />
            }
            label="System updates"
          />
        </FormGroup>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary">
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationSettings;
