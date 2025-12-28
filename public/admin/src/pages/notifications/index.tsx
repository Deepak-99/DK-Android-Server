import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
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
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  Archive as ArchiveIcon
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

const NotificationCenter: React.FC = () => {
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 0) return matchesSearch; // All
    if (activeTab === 1) return !notification.read && matchesSearch; // Unread
    if (activeTab === 2) return notification.type === 'error' && matchesSearch; // Alerts
    return true;
  });

  const handleToggle = (id: string) => {
    const currentIndex = selected.indexOf(id);
    const newSelected = [...selected];

    if (currentIndex === -1) {
      newSelected.push(id);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelected(newSelected);
  };

  const handleMarkAsRead = (ids: string[]) => {
    setNotifications(notifications.map(notification => 
      ids.includes(notification.id) ? { ...notification, read: true } : notification
    ));
    setSelected([]);
  };

  const handleDelete = (ids: string[]) => {
    setNotifications(notifications.filter(notification => 
      !ids.includes(notification.id)
    ));
    setSelected(selected.filter(id => !ids.includes(id)));
  };

  const getTypeColor = (type: string) => {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notification Center
        </Typography>
        <Box>
          <IconButton 
            color="inherit" 
            disabled={selected.length === 0}
            onClick={() => handleMarkAsRead(selected)}
            title="Mark as read"
          >
            <MarkEmailReadIcon />
          </IconButton>
          <IconButton 
            color="inherit" 
            disabled={selected.length === 0}
            onClick={() => handleDelete(selected)}
            title="Delete selected"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
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
          sx={{ borderBottom: 1, borderColor: 'divider' }}
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

      <List>
        {filteredNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <NotificationsOffIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No notifications found
            </Typography>
          </Box>
        ) : (
          filteredNotifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem 
                button 
                selected={selected.indexOf(notification.id) !== -1}
                onClick={() => handleToggle(notification.id)}
                sx={{
                  bgcolor: notification.read ? 'background.paper' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selected.indexOf(notification.id) !== -1}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemIcon>
                  {notification.read ? (
                    <NotificationsNoneIcon />
                  ) : (
                    <NotificationsIcon color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="subtitle1" 
                        component="span"
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
                      <Typography
                        component="span"
                        variant="body2"
                        color="textPrimary"
                        sx={{ display: 'block' }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                      >
                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
                <Box sx={{ display: 'flex' }}>
                  {!notification.read && (
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead([notification.id]);
                      }}
                      title="Mark as read"
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
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
};

export default NotificationCenter;
