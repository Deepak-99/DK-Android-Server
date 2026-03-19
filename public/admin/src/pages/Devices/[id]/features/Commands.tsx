import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';

import {
  Send,
  Refresh,
  Delete,
  CheckCircle,
  Error as ErrorIcon,
  Schedule
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getCommandHistory,
  sendCommand,
  deleteCommand,
  retryCommand
} from '../../../../services/commands';

import ErrorBoundary from '../../../../components/common/ErrorBoundary';
import { formatDistanceToNow } from 'date-fns';

// ------------------------------------------------

const COMMAND_TYPES = [
  { value: 'lock', label: 'Lock Device' },
  { value: 'wipe', label: 'Wipe Device' },
  { value: 'ring', label: 'Ring Device' },
  { value: 'message', label: 'Send Message' },
  { value: 'reboot', label: 'Reboot Device' },
  { value: 'screenshot', label: 'Take Screenshot' },
  { value: 'location', label: 'Get Location' },
  { value: 'wipe_app_data', label: 'Wipe App Data' },
  { value: 'uninstall_app', label: 'Uninstall App' },
  { value: 'install_app', label: 'Install App' },
  { value: 'open_url', label: 'Open URL' },
];

// ------------------------------------------------

const Commands = () => {

  const { id: deviceId } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [commandType, setCommandType] = useState('');
  const [commandData, setCommandData] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<any>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

  // ------------------------------------------------
  // Fetch commands
  // ------------------------------------------------

  const {
    data: commands = [],
    isLoading,
    isError,
    refetch
  } = useQuery({

    queryKey: ['commands', deviceId],

    queryFn: () => getCommandHistory(deviceId!),

    enabled: !!deviceId
  });

  // ------------------------------------------------
  // Send mutation
  // ------------------------------------------------

  const sendMutation = useMutation({

    mutationFn: (payload: { type: string; data: string }) =>
      sendCommand(deviceId!, payload.type, payload.data),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commands']
      });

      enqueueSnackbar('Command sent', { variant: 'success' });
    },

    onError: () => {
      enqueueSnackbar('Failed to send command', { variant: 'error' });
    }
  });

  // ------------------------------------------------
  // Delete mutation
  // ------------------------------------------------

  const deleteMutation = useMutation({

    mutationFn: (id: string) =>
      deleteCommand(deviceId!, id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commands']
      });

      enqueueSnackbar('Command deleted', { variant: 'success' });
    }
  });

  // ------------------------------------------------
  // Retry mutation
  // ------------------------------------------------

  const retryMutation = useMutation({

    mutationFn: (id: string) =>
      retryCommand(deviceId!, id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['commands']
      });

      enqueueSnackbar('Command retried', { variant: 'success' });
    }
  });

  // ------------------------------------------------

  const handleSend = () => {
    if (!commandType) return;
    setConfirmOpen(true);
  };

  const confirmSend = () => {

    sendMutation.mutate({
      type: commandType,
      data: commandData
    });

    setConfirmOpen(false);
    setCommandType('');
    setCommandData('');
  };

  // ------------------------------------------------

  const getStatusChip = (status: string) => {

    switch (status) {

      case 'completed':
        return <Chip icon={<CheckCircle />} label="Completed" color="success" size="small" />;

      case 'failed':
        return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />;

      case 'pending':
        return <Chip icon={<Schedule />} label="Pending" color="warning" size="small" />;

      default:
        return <Chip label={status} size="small" />;
    }
  };

  // ------------------------------------------------

  if (isError) {
    return <Typography color="error">Failed to load commands</Typography>;
  }

  // ------------------------------------------------

  return (

    <ErrorBoundary>

      <Box>

        {/* Send Command */}

        <Typography variant="h5" mb={2}>
          Send Command
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>

          <Box display="flex" gap={2} flexWrap="wrap">

            <TextField
              select
              size="small"
              label="Command"
              value={commandType}
              onChange={e => setCommandType(e.target.value)}
              sx={{ minWidth: 220 }}
            >

              {COMMAND_TYPES.map(cmd => (
                <MenuItem key={cmd.value} value={cmd.value}>
                  {cmd.label}
                </MenuItem>
              ))}

            </TextField>

            <TextField
              size="small"
              label="Data (optional)"
              value={commandData}
              onChange={e => setCommandData(e.target.value)}
              sx={{ flex: 1 }}
            />

            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSend}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </Button>

          </Box>

        </Paper>

        {/* History */}

        <Box display="flex" justifyContent="space-between" mb={2}>

          <Typography variant="h5">
            Command History
          </Typography>

          <Button
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>

        </Box>

        <Paper>

          {isLoading ? (

            <Box p={3} textAlign="center">
              <CircularProgress />
            </Box>

          ) : commands.length === 0 ? (

            <ListItem>
              <ListItemText primary="No commands found" />
            </ListItem>

          ) : (

            <List>

              {commands.map((cmd: any) => (

                <ListItem
                  key={cmd.id}
                  divider
                  secondaryAction={

                    <Box display="flex" gap={1}>

                      {cmd.status === 'failed' && (

                        <Tooltip title="Retry">

                          <IconButton
                            onClick={() => retryMutation.mutate(cmd.id)}
                            disabled={retryMutation.isPending}
                          >
                            <Refresh fontSize="small" />
                          </IconButton>

                        </Tooltip>
                      )}

                      <Tooltip title="Delete">

                        <IconButton
                          onClick={() => deleteMutation.mutate(cmd.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Delete fontSize="small" />
                        </IconButton>

                      </Tooltip>

                    </Box>
                  }
                >

                  <ListItemText

                    primary={
                      <Box display="flex" gap={1} alignItems="center">

                        <Typography variant="subtitle1">
                          {cmd.command}
                        </Typography>

                        {getStatusChip(cmd.status)}

                      </Box>
                    }

                    secondary={
                      formatDistanceToNow(new Date(cmd.createdAt), {
                        addSuffix: true
                      })
                    }

                  />

                </ListItem>

              ))}

            </List>

          )}

        </Paper>

        {/* Confirm dialog */}

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>

          <DialogTitle>Confirm Command</DialogTitle>

          <DialogContent>
            <DialogContentText>
              Are you sure you want to send this command?
            </DialogContentText>
          </DialogContent>

          <DialogActions>

            <Button onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>

            <Button variant="contained" onClick={confirmSend}>
              Confirm
            </Button>

          </DialogActions>

        </Dialog>

      </Box>

    </ErrorBoundary>
  );
};

export default Commands;
