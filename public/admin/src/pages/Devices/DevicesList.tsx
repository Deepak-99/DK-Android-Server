import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme,
    IconButton,
    Tooltip,
    Chip
} from '@mui/material';
import {
    PhoneAndroid as DeviceIcon,
    Refresh as RefreshIcon,
    Wifi as OnlineIcon,
    WifiOff as OfflineIcon,
    MoreVert as MoreIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDevices } from '../../services/devices';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import usePagination from '../../hooks/usePagination';
import { getDevices } from '../../services/devices';
import { socket } from '../../services/websocket';
import { Device } from '../../types';

const DevicesList = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { page, rowsPerPage, handlePageChange, handleRowsPerPageChange } = usePagination();

    const { data, isLoading, isError, refetch } = useQuery(
        ['devices', { page, rowsPerPage,  search: searchTerm, searchTerm, status: statusFilter }],
        () => getDevices({
            page,
            limit: rowsPerPage,
            search: searchTerm,
            status: statusFilter === 'all' ? undefined : statusFilter
        }),
        {
            keepPreviousData: true,
            staleTime: 5 * 60 * 1000, // 5 minutes
        }
    );

    // Handle real-time updates
    useEffect(() => {
        const handleDeviceUpdate = (updatedDevice: Device) => {
            queryClient.setQueryData(
                ['devices', { page, rowsPerPage, searchTerm, status: statusFilter }],
                (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        items: oldData.items.map((device: Device) =>
                            device.id === updatedDevice.id ? updatedDevice : device
                        )
                    };
                }
            );
        };

        const handleNewDevice = (newDevice: Device) => {
            queryClient.setQueryData(
                ['devices', { page, rowsPerPage, searchTerm, status: statusFilter }],
                (oldData: any) => {
                    if (!oldData) return { items: [newDevice], total: 1 };
                    return {
                        ...oldData,
                        items: [newDevice, ...oldData.items].slice(0, rowsPerPage),
                        total: oldData.total + 1
                    };
                }
            );
        };

        socket.on('device:updated', handleDeviceUpdate);
        socket.on('device:new', handleNewDevice);

        return () => {
            socket.off('device:updated', handleDeviceUpdate);
            socket.off('device:new', handleNewDevice);
        };
    }, [page, rowsPerPage, searchTerm, statusFilter, queryClient]);

    const handleSearch = (query: string) => {
        setSearchTerm(query);
        setPage(1); // Reset to first page on new search
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setPage(1);
    };
  }, [refetch]);

    const handleRefresh = () => {
        refetch();
    };

    if (isLoading && !data) {
        return (
            <Box p={2}>
                <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />
                <LoadingSkeleton type="table" rows={5} height={53} />
            </Box>
        );
    }

    if (isError) {
        return (
            <Box p={3} textAlign="center">
                <Typography color="error">Failed to load devices. Please try again.</Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => refetch()}
                    startIcon={<RefreshIcon />}
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    const devices = data?.items || [];
    const total = data?.total || 0;

    return (
        <Box>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                flexWrap="wrap"
                gap={2}
            >
                <Typography variant="h5" component="h2">
                    Devices
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap" width={isMobile ? '100%' : 'auto'}>
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder="Search devices..."
                        filterOptions={[
                            { value: 'all', label: 'All Status' },
                            { value: 'online', label: 'Online' },
                            { value: 'offline', label: 'Offline' }
                        ]}
                        initialFilter={statusFilter}
                        onFilterChange={handleStatusFilter}
                    />
                    <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Paper sx={{ overflowX: 'auto' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Device</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Model</TableCell>
                                <TableCell>OS Version</TableCell>
                                <TableCell>Last Seen</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {devices.map((device) => (
                                <TableRow key={device.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center">
                                            <DeviceIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="subtitle2">{device.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {device.id}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={device.status === 'online' ? <OnlineIcon /> : <OfflineIcon />}
                                            label={device.status}
                                            color={device.status === 'online' ? 'success' : 'default'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{device.model || 'N/A'}</TableCell>
                                    <TableCell>{device.osVersion || 'N/A'}</TableCell>
                                    <TableCell>
                                        {device.lastSeen
                                            ? new Date(device.lastSeen).toLocaleString()
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small">
                                            <MoreIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {devices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            No devices found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Pagination
                    count={total}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setPage}
                    onRowsPerPageChange={setRowsPerPage}
                />
            </Paper>
        </Box>
    );
};

export default DevicesList;