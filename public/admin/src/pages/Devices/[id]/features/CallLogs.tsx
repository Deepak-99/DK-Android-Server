import { useState, useEffect } from 'react';
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
    InputAdornment,
    IconButton,
    TablePagination,
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { getCallLogs } from '../../../services/callLogs';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { CallLog } from '../../../types/callLog';

const CallLogs = () => {
    const { id: deviceId } = useParams<{ id: string }>();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    const { data, isLoading, error, refetch } = useQuery(
        ['callLogs', deviceId, page, rowsPerPage, searchTerm],
        () => getCallLogs(deviceId!, { page, limit: rowsPerPage, search: searchTerm }),
        { enabled: !!deviceId, keepPreviousData: true }
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const handleRefresh = () => {
        refetch();
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (error) {
        return <Typography color="error">Error loading call logs</Typography>;
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Call Logs</Typography>
                <Box display="flex" gap={2}>
                    <TextField
                        size="small"
                        placeholder="Search logs..."
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
                    <IconButton onClick={handleRefresh} disabled={isLoading}>
                        <Refresh />
                    </IconButton>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name/Number</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : data?.items?.length ? (
                            data.items.map((log: CallLog) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        <Box>
                                            <Typography>{log.contactName || log.phoneNumber}</Typography>
                                            {log.contactName && (
                                                <Typography variant="body2" color="textSecondary">
                                                    {log.phoneNumber}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.type}
                                            color={
                                                log.type === 'missed'
                                                    ? 'error'
                                                    : log.type === 'outgoing'
                                                        ? 'success'
                                                        : 'primary'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{log.duration || 'N/A'}</TableCell>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.status}
                                            color={log.status === 'completed' ? 'success' : 'default'}
                                            size="small"
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

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data?.total || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Box>
    );
};

export default CallLogs;