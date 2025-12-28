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
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

interface MenuItem {
    text: string;
    icon: ReactNode;
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
        setMobileOpen(!mobileOpen);
    };

    const handleSubmenuClick = (text: string) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [text]: !prev[text]
        }));
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const isActive = (path: string) => {
        return location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
    };

    const drawer = (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.paper'
        }}>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    DK Hawkshaw
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <Box key={item.text}>
                        <ListItem
                            button
                            onClick={() =>
                                item.children
                                    ? handleSubmenuClick(item.text)
                                    : handleNavigation(item.path)
                            }
                            selected={isActive(item.path)}
                        >
                            <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                            {item.children && (
                                openSubmenus[item.text] ? <ExpandLess /> : <ExpandMore />
                            )}
                        </ListItem>
                        {item.children && (
                            <Collapse in={openSubmenus[item.text] || false} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {item.children.map((child) => (
                                        <ListItem
                                            key={child.path}
                                            button
                                            onClick={() => handleNavigation(child.path)}
                                            selected={isActive(child.path)}
                                            sx={{ pl: 4 }}
                                        >
                                            <ListItemText
                                                primary={child.text}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    color: isActive(child.path) ? 'primary' : 'inherit'
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Collapse>
                        )}
                    </Box>
                ))}
            </List>
            <Box sx={{ mt: 'auto', p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <ListItem
                    button
                    onClick={() => {
                        logout();
                        handleNavigation('/login');
                    }}
                >
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
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
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        {menuItems.find(item => isActive(item.path))?.text || 'Dashboard'}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant={isMobile ? 'temporary' : 'permanent'}
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better open performance on mobile
                    }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            borderRight: 'none',
                            boxShadow: theme.shadows[3]
                        },
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: 8, sm: 0 },
                    minHeight: '100vh',
                    backgroundColor: theme.palette.background.default
                }}
            >
                <Toolbar /> {/* This pushes content below the app bar */}
                {children}
            </Box>
        </Box>
    );
};

export default ResponsiveLayout;