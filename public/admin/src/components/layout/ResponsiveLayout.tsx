import { useState, ReactNode } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Devices as DevicesIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon
} from '@mui/icons-material';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon?: ReactNode; // ✅ optional now
  path: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/'
  },
  {
    text: 'Devices',
    icon: <DevicesIcon />,
    path: '/devices',
    children: [
      { text: 'All Devices', path: '/devices' },
      { text: 'Online', path: '/devices?status=online' },
      { text: 'Offline', path: '/devices?status=offline' }
    ]
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings'
  }
];

const ResponsiveLayout = ({ children }: { children: ReactNode }) => {

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(prev => !prev);
  };

  const handleSubmenuClick = (text: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isActive = (path: string) => {
    return (
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path))
    );
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <Toolbar>
        <Typography variant="h6">DK Hawkshaw</Typography>
      </Toolbar>

      <Divider />

      <List>

        {menuItems.map(item => (
          <Box key={item.text}>

            {/* MAIN ITEM */}
            <ListItem disablePadding>

              <ListItemButton
                onClick={() =>
                  item.children
                    ? handleSubmenuClick(item.text)
                    : handleNavigation(item.path)
                }
                selected={isActive(item.path)}
              >

                {item.icon && (
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? 'primary.main' : 'inherit'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                )}

                <ListItemText primary={item.text} />

                {item.children &&
                  (openSubmenus[item.text] ? <ExpandLess /> : <ExpandMore />)}

              </ListItemButton>

            </ListItem>

            {/* SUB MENU */}
            {item.children && (
              <Collapse in={openSubmenus[item.text]} timeout="auto" unmountOnExit>

                <List component="div" disablePadding>

                  {item.children.map(child => (

                    <ListItem disablePadding key={child.path}>

                      <ListItemButton
                        sx={{ pl: 4 }}
                        onClick={() => handleNavigation(child.path)}
                        selected={isActive(child.path)}
                      >

                        <ListItemText
                          primary={child.text}
                          slotProps={{
                            primary: {
                              variant: 'body2',
                              color: isActive(child.path)
                                ? 'primary'
                                : 'text.primary'
                            }
                          }}
                        />

                      </ListItemButton>

                    </ListItem>

                  ))}

                </List>

              </Collapse>
            )}

          </Box>
        ))}

      </List>

      {/* LOGOUT */}
      <Box sx={{ mt: 'auto' }}>
        <Divider />

        <ListItem disablePadding>

          <ListItemButton
            onClick={() => {
              logout();
              handleNavigation('/login');
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Logout" />
          </ListItemButton>

        </ListItem>

      </Box>

    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >

        <Toolbar>

          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap>
            {menuItems.find(item => isActive(item.path))?.text || 'Dashboard'}
          </Typography>

        </Toolbar>

      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        {children}
      </Box>

    </Box>
  );
};

export default ResponsiveLayout;
