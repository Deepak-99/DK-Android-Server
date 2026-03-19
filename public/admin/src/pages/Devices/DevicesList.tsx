import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Skeleton,
  Select,
  MenuItem
} from '@mui/material';

import {
  PhoneAndroid as DeviceIcon,
  Refresh as RefreshIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

import { getDevices, Device } from '../../services/devices';
import usePagination from '../../hooks/usePagination';
import useSearch from '../../hooks/useSearch';
import { useWebSocket } from '../../hooks/useWebSocket';

import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const DevicesList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  /* ================================
     Pagination Hook
  ================================= */

  const {
    page,
    rowsPerPage,
    handlePageChange,
    handleRowsPerPageChange
  } = usePagination();

  /* ================================
     Search Hook
  ================================= */

  const {
    query,
    filter,
    handleSearch,
    handleFilterChange
  } = useSearch({
    initialFilter: 'all',
    debounceTime: 400,
    onSearch: () => {
      handlePageChange(1);
    }
  });

  /* ================================
     React Query
  ================================= */

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['devices', page, rowsPerPage, query, filter],

    queryFn: () =>
      getDevices({
        page,
        limit: rowsPerPage,
        search: query,
        status:
          filter === 'all'
            ? undefined
            : (filter as 'online' | 'offline')
      }),

    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000
  });

  const devices: Device[] = data?.items ?? [];
  const total = data?.total ?? 0;

  /* ================================
     Real-time WebSocket Updates
  ================================= */

  useWebSocket<Device>('device:updated', (updatedDevice) => {
    queryClient.setQueryData(
      ['devices', page, rowsPerPage, query, filter],
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
  });

  /* ================================
     Handlers
  ================================= */

  const handleRefresh = async () => {
    await refetch();
  };

  /* ================================
     Loading
  ================================= */

  if (isLoading && !data) {
    return (
      <Box p={2}>
        <Skeleton
          variant="rectangular"
          height={56}
          sx={{ mb: 2, borderRadius: 1 }}
        />
        <LoadingSkeleton type="table" rows={5} height={53} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">
          Failed to load devices.
        </Typography>

        <Button
          variant="outlined"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  /* ================================
     UI
  ================================= */

  return (
    <ErrorBoundary>
      <Box>

        {/* Header */}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <Typography variant="h5">
            Devices
          </Typography>

          <Box
            display="flex"
            gap={2}
            flexWrap="wrap"
            width={isMobile ? '100%' : 'auto'}
          >
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search devices..."
            />

            <Select
              size="small"
              value={filter}
              onChange={(e) =>
                handleFilterChange(e.target.value)
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>

            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Table */}

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
                        <DeviceIcon sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {device.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {device.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={
                          device.status === 'online'
                            ? <OnlineIcon />
                            : <OfflineIcon />
                        }
                        label={device.status}
                        color={
                          device.status === 'online'
                            ? 'success'
                            : 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      {device.model ?? 'N/A'}
                    </TableCell>

                    <TableCell>
                      {device.osVersion ?? 'N/A'}
                    </TableCell>

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
                    <TableCell colSpan={6} align="center">
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
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      </Box>
    </ErrorBoundary>
  );
};

export default DevicesList;
