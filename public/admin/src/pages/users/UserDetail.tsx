import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Avatar,
    Divider,
    Grid,
    Chip,
    CircularProgress,
    Tabs,
    Tab,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    DialogContentText,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    ArrowBack as ArrowBackIcon,
    LockReset as ResetPasswordIcon,
    Person as PersonIcon,
    Lock as LockIcon,
    History as HistoryIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { User, UserRole } from '../../../types/user';
import { userService } from '../../../services/userService';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`user-tabpanel-${index}`}
            aria-labelledby={`user-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `user-tab-${index}`,
        'aria-controls': `user-tabpanel-${index}`,
    };
}

const UserDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [tabValue, setTabValue] = useState(0);
    const [openResetDialog, setOpenResetDialog] = useState(false);
    const [openStatusDialog, setOpenStatusDialog] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!id) return;
                const userData = await userService.getUserById(id);
                setUser(userData);
            } catch (error) {
                enqueueSnackbar('Failed to load user data', { variant: 'error' });
                navigate('/users');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, navigate, enqueueSnackbar]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleResetPassword = async () => {
        if (!user) return;

        if (!newPassword) {
            setPasswordError('New password is required');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        try {
            await userService.resetPassword(user.id, newPassword);
            enqueueSnackbar('Password reset successfully', { variant: 'success' });
            setOpenResetDialog(false);
            setNewPassword('');
        } catch (error) {
            enqueueSnackbar('Failed to reset password', { variant: 'error' });
        }
    };

    const toggleUserStatus = async () => {
        if (!user) return;

        try {
            const updatedUser = await userService.updateUserStatus(
                user.id,
                !user.isActive
            );
            setUser(updatedUser);
            enqueueSnackbar(
                `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
                { variant: 'success' }
            );
            setOpenStatusDialog(false);
        } catch (error) {
            enqueueSnackbar('Failed to update user status', { variant: 'error' });
        }
    };

    if (loading || !user) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'primary';
            case 'manager':
                return 'secondary';
            default:
                return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <IconButton onClick={() => navigate('/users')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                    User Details
                </Typography>
            </Box>

            <Paper sx={{ mb: 3, p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                width: 150,
                                height: 150,
                                fontSize: '3rem',
                                mb: 2,
                                bgcolor: 'primary.main',
                            }}
                        >
                            {user.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                            {user.fullName}
                        </Typography>
                        <Chip
                            label={user.role}
                            color={getRoleColor(user.role)}
                            size="small"
                            sx={{ mb: 2 }}
                        />
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                color: user.isActive ? 'success.main' : 'error.main',
                                mb: 2,
                            }}
                        >
                            {user.isActive ? (
                                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                            ) : (
                                <BlockIcon color="error" sx={{ mr: 1 }} />
                            )}
                            <Typography variant="body2">
                                {user.isActive ? 'Active' : 'Inactive'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2, width: '100%' }}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                fullWidth
                                onClick={() => navigate(`/users/edit/${user.id}`)}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outlined"
                                color={user.isActive ? 'error' : 'success'}
                                startIcon={user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                                onClick={() => setOpenStatusDialog(true)}
                                fullWidth
                            >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={9}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                aria-label="user details tabs"
                            >
                                <Tab label="Overview" {...a11yProps(0)} />
                                <Tab label="Security" {...a11yProps(1)} />
                                <Tab label="Activity" {...a11yProps(2)} />
                            </Tabs>
                        </Box>

                        <TabPanel value={tabValue} index={0}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Username
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {user.username}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {user.email}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Status
                                    </Typography>
                                    <Box display="flex" alignItems="center">
                                        <Box
                                            sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: user.isActive ? 'success.main' : 'error.main',
                                                mr: 1,
                                            }}
                                        />
                                        <Typography variant="body1">
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Last Login
                                    </Typography>
                                    <Typography variant="body1">
                                        {user.lastLogin
                                            ? format(new Date(user.lastLogin), 'PPpp')
                                            : 'Never logged in'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Member Since
                                    </Typography>
                                    <Typography variant="body1">
                                        {format(new Date(user.createdAt), 'PP')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {format(new Date(user.updatedAt), 'PPpp')}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Security Settings
                                </Typography>
                                <Typography variant="body2" color="textSecondary" paragraph>
                                    Manage user security settings and permissions.
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle1">Reset Password</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Set a new password for this user
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<LockResetIcon />}
                                    onClick={() => setOpenResetDialog(true)}
                                >
                                    Reset Password
                                </Button>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box>
                                    <Typography variant="subtitle1">Two-Factor Authentication</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {user.twoFactorEnabled
                                            ? 'Two-factor authentication is enabled'
                                            : 'Two-factor authentication is disabled'}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    disabled
                                    startIcon={<LockIcon />}
                                >
                                    {user.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </Button>
                            </Box>
                        </TabPanel>

                        <TabPanel value={tabValue} index={2}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    User Activity
                                </Typography>
                                <Typography variant="body2" color="textSecondary" paragraph>
                                    View recent activities and login history.
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                }}
                            >
                                <Typography variant="subtitle1">Recent Logins</Typography>
                                {user.lastLogin ? (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 1.5,
                                            bgcolor: 'background.paper',
                                            borderRadius: 1,
                                            boxShadow: 1,
                                        }}
                                    >
                                        <HistoryIcon color="action" />
                                        <Box>
                                            <Typography variant="body2">
                                                Last login on {format(new Date(user.lastLogin), 'PPpp')}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                IP: {user.lastLoginIp || 'Unknown'} • {user.lastLoginUserAgent || 'Unknown device'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        No login history available
                                    </Typography>
                                )}
                            </Box>
                        </TabPanel>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default UserDetail;