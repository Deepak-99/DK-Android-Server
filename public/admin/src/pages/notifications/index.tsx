import { useState, Fragment } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Divider,
  Chip,
  Paper,
  Tabs,
  Tab,
  Badge,
  TextField,
  InputAdornment
} from '@mui/material';

import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  NotificationsOff as NotificationsOffIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon
} from '@mui/icons-material';

import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  source: string;
}

export default function NotificationCenter() {

  const [activeTab, setActiveTab] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Device Connected',
      message: 'A new device has been connected to your account.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
      type: 'success',
      source: 'System'
    },
    // Add more mock notifications...
  ]);

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 0) return matchesSearch;
    if (activeTab === 1) return !notification.read && matchesSearch;
    if (activeTab === 2) return notification.type === 'error' && matchesSearch;

    return true;
  });

  const handleToggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleMarkAsRead = (ids: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        ids.includes(notification.id)
          ? { ...notification, read: true }
          : notification
      )
    );
    setSelected([]);
  };

  const handleDelete = (ids: string[]) => {
    setNotifications(prev =>
      prev.filter(notification => !ids.includes(notification.id))
    );
    setSelected(prev => prev.filter(id => !ids.includes(id)));
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'success.main';
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      case 'info':
      default:
        return 'info.main';
    }
  };

  return (
    <Box sx={{ p: 3 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Notification Center
        </Typography>

        <Box>
          <IconButton
            disabled={selected.length === 0}
            onClick={() => handleMarkAsRead(selected)}
            title="Mark as read"
          >
            <MarkEmailReadIcon />
          </IconButton>

          <IconButton
            disabled={selected.length === 0}
            onClick={() => handleDelete(selected)}
            title="Delete selected"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search & Tabs */}
      <Paper sx={{ mb: 3, p: 2 }}>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }
            }}
          />

          <IconButton sx={{ ml: 1 }}>
            <FilterListIcon />
          </IconButton>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab
            label={
              <Badge badgeContent={notifications.length} color="primary">
                All
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={notifications.filter(n => !n.read).length}
                color="error"
              >
                Unread
              </Badge>
            }
          />
          <Tab
            label={
              <Badge
                badgeContent={notifications.filter(n => n.type === 'error').length}
                color="warning"
              >
                Alerts
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* List */}
      <List>

        {filteredNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <NotificationsOffIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications found
            </Typography>
          </Box>
        ) : (

          filteredNotifications.map((notification) => (

            <Fragment key={notification.id}>

              <ListItem disablePadding>
                <ListItemButton
                  selected={selected.includes(notification.id)}
                  onClick={() => handleToggle(notification.id)}
                  sx={{
                    bgcolor: notification.read ? 'background.paper' : 'action.hover',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >

                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selected.includes(notification.id)}
                      disableRipple
                    />
                  </ListItemIcon>

                  <ListItemIcon>
                    {notification.read
                      ? <NotificationsNoneIcon />
                      : <NotificationsIcon color="primary" />
                    }
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            mr: 1
                          }}
                        >
                          {notification.title}
                        </Typography>

                        <Chip
                          label={notification.source}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.6rem',
                            bgcolor: getTypeColor(notification.type),
                            color: 'white'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />

                  {!notification.read && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead([notification.id]);
                      }}
                    >
                      <MarkEmailReadIcon fontSize="small" />
                    </IconButton>
                  )}

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete([notification.id]);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>

                </ListItemButton>
              </ListItem>

              <Divider component="li" />

            </Fragment>
          ))
        )}

      </List>
    </Box>
  );
}
