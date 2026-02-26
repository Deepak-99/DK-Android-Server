import { Box, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const Sidebar = () => {
  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        borderRight: '1px solid #ddd',
        pt: 8,
      }}
    >
      <List>

        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Devices" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton>
            <ListItemText primary="Logs" />
          </ListItemButton>
        </ListItem>

      </List>
    </Box>
  );
};

export default Sidebar;
