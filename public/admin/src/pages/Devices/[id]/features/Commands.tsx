import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Send,
  Refresh,
  Delete,
  Info,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCommandHistory,
  sendCommand,
  deleteCommand,
  retryCommand,
} from '../../../services/commands';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { formatDistanceToNow } from 'date-fns';

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

const Commands = () => {
  const { id: deviceId } = useParams<{ id: string }>();
  const [commandType, setCommandType] = useState('');
  const [commandData, setCommandData] = useState('');
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<any>(null);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {
    data: commands = [],
    isLoading,
    error,
    refetch,
  } = useQuery(['commands', deviceId], () => getCommandHistory(deviceId!));

  const sendCommandMutation = useMutation(
    (payload: { type: string; data: string }) =>
      sendCommand(deviceId!, payload.type, payload.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['commands', deviceId]);
        enqueueSnackbar('Command sent successfully', { variant: 'success' });
      },
      onError: (error: any) => {
        enqueueSnackbar(error.message || 'Failed to send command', {
          variant: 'error',
        });
      },
    }
  );

  const deleteCommandMutation = useMutation(
    (commandId: string) => deleteCommand(deviceId!, commandId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['commands', deviceId]);
        enqueueSnackbar('Command deleted successfully', { variant: 'success' });
      },
    }
  );

  const retryCommandMutation = useMutation(
    (commandId: string) => retryCommand(deviceId!, commandId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['commands', deviceId]);
        enqueueSnackbar('Command retried successfully', { variant: 'success' });
      },
    }
  );

  const handleSendCommand = () => {
    if (!commandType) {
      enqueueSnackbar('Please select a command type', { variant: 'warning' });
      return;
    }

    const command = COMMAND_TYPES.find((cmd) => cmd.value === commandType);
    setPendingCommand({
      type: commandType,
      label: command?.label || commandType,
      data: commandData,
    });
    setOpenConfirmDialog(true);
  };

  const confirmSendCommand = () => {
    sendCommandMutation.mutate({
      type: pendingCommand.type,
      data: pendingCommand.data,
    });
    setOpenConfirmDialog(false);
    setCommandType('');
    setCommandData('');
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Chip
            icon={<CheckCircle fontSize="small" />}
            label="Completed"
            color="success"
            size="small"
          />
        );
      case 'failed':
        return (
          <Chip
            icon={<ErrorIcon fontSize="small" />}
            label="Failed"
            color="error"
            size="small"
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<Schedule fontSize="small" />}
            label="Pending"
            color="warning"
            size="small"
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (error) {
    return <Typography color="error">Error loading command history</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Send Command
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
          <TextField
            select
            label="Command Type"
            value={commandType}
            onChange={(e) => setCommandType(e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            {COMMAND_TYPES.map((cmd) => (
              <MenuItem key={cmd.value} value={cmd.value}>
                {cmd.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Command Data (Optional)"
            value={commandData}
            onChange={(e) => setCommandData(e.target.value)}
            placeholder="e.g., message text, package name, etc."
            sx={{ flexGrow: 1 }}
            size="small"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSendCommand}
            disabled={!commandType || sendCommandMutation.isLoading}
            startIcon={<Send />}
          >
            {sendCommandMutation.isLoading ? 'Sending...' : 'Send Command'}
          </Button>
        </Box>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            <Info fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {commandType
              ? `Command: ${
                  COMMAND_TYPES.find((cmd) => cmd.value === commandType)?.label ||
                  commandType
                }${commandData ? ` - ${commandData}` : ''}`
              : 'Select a command type to see details'}
          </Typography>
        </Box>
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Command History</Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      <Paper>
        <List>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : commands.length === 0 ? (
            <ListItem>
              <ListItemText primary="No commands found" />
            </ListItem>
          ) : (
            commands.map((cmd: any) => (
              <ListItem
                key={cmd.id}
                divider
                secondaryAction={
                  <Box display="flex" gap={1}>
                    {cmd.status === 'failed' && (
                      <Tooltip title="Retry">
                        <IconButton
                          edge="end"
                          onClick={() => retryCommandMutation.mutate(cmd.id)}
                          disabled={retryCommandMutation.isLoading}
                        >
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        onClick={() => deleteCommandMutation.mutate(cmd.id)}
                        disabled={deleteCommandMutation.isLoading}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography variant="subtitle1">
                        {COMMAND_TYPES.find((c) => c.value === cmd.type)?.label ||
                          cmd.type}
                      </Typography>
                      {getStatusChip(cmd.status)}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        display="block"
                      >
                        {cmd.data && `Data: ${cmd.data}`}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDistanceToNow(new Date(cmd.createdAt), {
                          addSuffix: true,
                        })}
                        {cmd.updatedAt !== cmd.createdAt &&
                          ` • Updated ${formatDistanceToNow(
                            new Date(cmd.updatedAt),
                            { addSuffix: true }
                          )}`}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirm Command</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send the following command?
          </DialogContentText>
          <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="subtitle1">
              <strong>Command:</strong> {pendingCommand?.label}
            </Typography>
            {pendingCommand?.data && (
              <Typography variant="body2">
                <strong>Data:</strong> {pendingCommand.data}
              </Typography>
            )}
          </Box>
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              <Info fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              This action will be executed on the device immediately.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmSendCommand}
            color="primary"
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Commands;