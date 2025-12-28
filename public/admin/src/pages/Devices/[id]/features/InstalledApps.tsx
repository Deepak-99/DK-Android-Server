import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    CircularProgress,
    Button,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Search,
    Refresh,
    FilterList,
    MoreVert,
    Delete,
    Info,
    GetApp,
    Visibility,
    Block,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getInstalledApps,
    uninstallApp,
    blockApp,
    launchApp,
    exportApp,
} from '../../../services/apps';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const InstalledApps = () => {
    const { id: deviceId } = useParams<{ id: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const {
        data: { items: apps = [], total = 0 } = {},
        isLoading,
        error,
        refetch,
    } = useQuery(
        ['installedApps', deviceId, page, rowsPerPage, searchTerm],
        () =>
            getInstalledApps(deviceId!, {
                page: page + 1,
                limit: rowsPerPage,
                search: searchTerm,
            }),
        { keepPreviousData: true }
    );

    const uninstallMutation = useMutation(
        (packageName: string) => uninstallApp(deviceId!, packageName),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['installedApps', deviceId]);
                enqueueSnackbar('App uninstalled successfully', { variant: 'success' });
            },
            onError: () => {
                enqueueSnackbar('Failed to uninstall app', { variant: 'error' });
            },
        }
    );

    const blockMutation = useMutation(
        (packageName: string) => blockApp(deviceId!, packageName),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['installedApps', deviceId]);
                enqueueSnackbar('App blocked successfully', { variant: 'success' });
            },
        }
    );

    const launchAppMutation = useMutation(
        (packageName: string) => launchApp(deviceId!, packageName),
        {
            onSuccess: () => {
                enqueueSnackbar('App launched successfully', { variant: 'success' });
            },
        }
    );

    const exportAppMutation = useMutation(
        (packageName: string) => exportApp(deviceId!, packageName),
        {
            onSuccess: () => {
                enqueueSnackbar('App exported successfully', { variant: 'success' });
            },
        }
    );

    const handleMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        app: any
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedApp(app);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    if (error) {
        return <Typography color="error">Error loading installed apps</Typography>;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Installed Applications</Typography>
                <Box display="flex" gap={2}>
                    <TextField
                        size="small"
                        placeholder="Search apps..."
                        value={searchTerm}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<FilterList />}
                        onClick={() => {
                            // TODO: Implement filter dialog
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>App Name</TableCell>
                            <TableCell>Package Name</TableCell>
                            <TableCell>Version</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Installed</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : apps.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No apps found
                                </TableCell>
                            </TableRow>
                        ) : (
                            apps.map((app: any) => (
                                <TableRow key={app.packageName}>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {app.iconUrl ? (
                                                <img
                                                    src={app.iconUrl}
                                                    alt={app.name}
                                                    style={{ width: 24, height: 24 }}
                                                />
                                            ) : (
                                                <Box
                                                    width={24}
                                                    height={24}
                                                    bgcolor="action.hover"
                                                    borderRadius="4px"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    <Typography variant="caption" color="text.secondary">
                                                        {app.name.charAt(0).toUpperCase()}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Typography>{app.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {app.packageName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{app.versionName}</TableCell>
                                    <TableCell>{app.size ? `${(app.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</TableCell>
                                    <TableCell>
                                        {new Date(app.installTime).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {app.enabled ? (
                                            <Chip label="Enabled" color="success" size="small" />
                                        ) : (
                                            <Chip label="Disabled" color="default" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box display="flex" justifyContent="flex-end" gap={1}>
                                            <Tooltip title="Launch App">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => launchAppMutation.mutate(app.packageName)}
                                                    disabled={!app.enabled}
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, app)}
                                            >
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* App Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem
                    onClick={() => {
                        if (selectedApp) {
                            launchAppMutation.mutate(selectedApp.packageName);
                        }
                        handleMenuClose();
                    }}
                    disabled={!selectedApp?.enabled}
                >
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Launch App</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedApp) {
                            exportAppMutation.mutate(selectedApp.packageName);
                        }
                        handleMenuClose();
                    }}
                >
                    <ListItemIcon>
                        <GetApp fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Export APK</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedApp) {
                            blockMutation.mutate(selectedApp.packageName);
                        }
                        handleMenuClose();
                    }}
                    disabled={!selectedApp?.enabled}
                >
                    <ListItemIcon>
                        <Block fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Block App</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        if (selectedApp) {
                            uninstallMutation.mutate(selectedApp.packageName);
                        }
                        handleMenuClose();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <ListItemIcon sx={{ color: 'error.main' }}>
                        <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Uninstall</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default InstalledApps;