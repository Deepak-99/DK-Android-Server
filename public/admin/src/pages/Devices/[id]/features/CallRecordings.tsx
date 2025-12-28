import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  PlayArrow,
  Pause,
  Delete,
  Download,
  Refresh,
  Info,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCallRecordings,
  deleteCallRecording,
  downloadCallRecording,
} from '../../../services/callRecordings';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import { formatFileSize, formatDate } from '../../../utils/format';

const CallRecordings = () => {
  const { id: deviceId } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const {
    data: recordings = [],
    isLoading,
    error,
    refetch,
  } = useQuery(['callRecordings', deviceId, searchTerm], () =>
    getCallRecordings(deviceId!, searchTerm)
  );

  const deleteMutation = useMutation(
    (recordingId: string) => deleteCallRecording(deviceId!, recordingId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['callRecordings', deviceId]);
        enqueueSnackbar('Recording deleted successfully', { variant: 'success' });
      },
      onError: () => {
        enqueueSnackbar('Failed to delete recording', { variant: 'error' });
      },
    }
  );

  const handlePlayPause = (recording: any) => {
    if (selectedRecording?.id === recording.id) {
      setIsPlaying(!isPlaying);
    } else {
      setSelectedRecording(recording);
      setIsPlaying(true);
      // TODO: Implement actual audio playback
    }
  };

  const handleDelete = (recordingId: string) => {
    deleteMutation.mutate(recordingId);
    setOpenDeleteDialog(false);
  };

  const handleDownload = async (recording: any) => {
    try {
      await downloadCallRecording(deviceId!, recording.id, recording.filename);
    } catch (error) {
      enqueueSnackbar('Failed to download recording', { variant: 'error' });
    }
  };

  if (error) {
    return <Typography color="error">Error loading call recordings</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Call Recordings</Typography>
        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Search recordings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : recordings.length === 0 ? (
        <Box textAlign="center" my={4}>
          <Typography>No call recordings found</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {recordings.map((recording: any) => (
            <Grid item xs={12} sm={6} md={4} key={recording.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={recording.thumbnailUrl || '/placeholder-recording.jpg'}
                  alt="Call recording"
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" noWrap>
                    {recording.contactName || 'Unknown Caller'}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Chip
                      label={recording.type}
                      size="small"
                      color={
                        recording.type === 'incoming'
                          ? 'primary'
                          : recording.type === 'outgoing'
                          ? 'success'
                          : 'default'
                      }
                    />
                    <Box ml="auto" display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handlePlayPause(recording)}
                      >
                        {isPlaying && selectedRecording?.id === recording.id ? (
                          <Pause fontSize="small" />
                        ) : (
                          <PlayArrow fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(recording)}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setOpenDeleteDialog(true)}
                      >
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(recording.timestamp)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(recording.fileSize)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {recording.duration}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Delete Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this recording? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={() => selectedRecording && handleDelete(selectedRecording.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audio Player */}
      {selectedRecording && (
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          p={2}
          bgcolor="background.paper"
          boxShadow={3}
        >
          <Box display="flex" alignItems="center" maxWidth={1200} mx="auto">
            <IconButton onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
            <Box ml={2} flexGrow={1}>
              <Typography variant="subtitle1">
                {selectedRecording.contactName || 'Unknown Caller'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(selectedRecording.timestamp)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedRecording.duration}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CallRecordings;