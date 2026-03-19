import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  TextField,
  IconButton,
  TablePagination,
  InputAdornment
} from '@mui/material';

import { Search, Refresh } from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';

import {
  getCallLogs,
  CallLog,
  CallLogsResponse
} from '../../../../services/callLogs';

// ------------------------------------------------------

const CallLogs = () => {

  const { id: deviceId } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();

  // Pagination state (MUI is zero-based)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // ------------------------------------------------------
  // React Query (Server Pagination)
  // ------------------------------------------------------

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery<CallLogsResponse>({

    queryKey: [
      'callLogs',
      deviceId,
      page,
      rowsPerPage,
      searchTerm
    ],

    queryFn: () =>
      getCallLogs(deviceId!, {
        page: page + 1, // backend expects 1-based page
        limit: rowsPerPage,
        search: searchTerm || undefined
      }),

    enabled: !!deviceId,

    // Keeps previous page data while loading next page
    placeholderData: previous => previous
  });

  // ------------------------------------------------------
  // Derived Data
  // ------------------------------------------------------

  const logs: CallLog[] = data?.data ?? [];
  const total: number = data?.pagination.total ?? 0;

  // ------------------------------------------------------
  // Handlers
  // ------------------------------------------------------

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleRefresh = async () => {
    await refetch();
    enqueueSnackbar('Call logs refreshed', { variant: 'success' });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // ------------------------------------------------------

  if (isError) {
    return (
      <Typography color="error">
        Failed to load call logs
      </Typography>
    );
  }

  // ------------------------------------------------------

  return (
    <Box>

      {/* ================= Header ================= */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >

        <Typography variant="h5">
          Call Logs
        </Typography>

        <Box display="flex" gap={2}>

          <TextField
            size="small"
            placeholder="Search number or contact..."
            value={searchTerm}
            onChange={handleSearch}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                )
              }
            }}
          />

          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <Refresh />
          </IconButton>

        </Box>

      </Box>

      {/* ================= Table ================= */}

      <TableContainer component={Paper}>
        <Table>

          <TableHead>
            <TableRow>
              <TableCell>Name / Number</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Read</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {isLoading ? (

              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>

            ) : logs.length ? (

              logs.map((log) => (

                <TableRow key={log.id} hover>

                  <TableCell>
                    <Typography>
                      {log.contactName || log.phoneNumber}
                    </Typography>

                    {log.contactName && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {log.phoneNumber}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={log.type}
                      size="small"
                      color={
                        log.type === 'missed'
                          ? 'error'
                          : log.type === 'outgoing'
                            ? 'success'
                            : 'primary'
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {log.duration ?? 0} sec
                  </TableCell>

                  <TableCell>
                    {new Date(log.date).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={log.isRead ? 'Read' : 'Unread'}
                      size="small"
                      color={log.isRead ? 'success' : 'warning'}
                    />
                  </TableCell>

                </TableRow>

              ))

            ) : (

              <TableRow>
                <TableCell colSpan={5} align="center">
                  No call logs found
                </TableCell>
              </TableRow>

            )}

          </TableBody>

        </Table>
      </TableContainer>

      {/* ================= Pagination ================= */}

      <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25]}
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

    </Box>
  );
};

export default CallLogs;
