import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import {
  Search,
  PlayArrow,
  Pause,
  Delete,
  Download,
  Refresh
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getCallRecordings,
  deleteCallRecording,
  downloadCallRecording
} from '../../../../services/callRecordingApi';

import ErrorBoundary from '../../../../components/common/ErrorBoundary';
import type { CallRecording } from '../../../CallRecordings/types';

// ---------------------------------------------------

const CallRecordings = () => {

  const { id: deviceId } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const [limit] = useState(12);

  const [selected, setSelected] = useState<CallRecording | null>(null);
  const [playing, setPlaying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ---------------------------------------------------
  // Fetch recordings
  // ---------------------------------------------------

  const {
    data,
    isLoading,
    isError,
    refetch
  } = useQuery({

    queryKey: ['callRecordings', deviceId, page, search],

    queryFn: () =>
      getCallRecordings(deviceId!, {
        page,
        limit,
        search
      }),

    enabled: !!deviceId,

    placeholderData: prev => prev
  });

  const recordings = data?.data ?? [];

  // ---------------------------------------------------
  // Delete mutation
  // ---------------------------------------------------

  const deleteMutation = useMutation({

    mutationFn: (id: string) =>
      deleteCallRecording(deviceId!, id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['callRecordings']
      });

      enqueueSnackbar('Recording deleted', { variant: 'success' });
    },

    onError: () => {
      enqueueSnackbar('Delete failed', { variant: 'error' });
    }
  });

  // ---------------------------------------------------

  const handlePlay = (rec: CallRecording) => {
    if (selected?.id === rec.id) {
      setPlaying(!playing);
    } else {
      setSelected(rec);
      setPlaying(true);
    }
  };

  const handleDelete = () => {
    if (!selected) return;

    deleteMutation.mutate(selected.id.toString());
    setDeleteOpen(false);
  };

  const handleDownload = (rec: CallRecording) => {
    downloadCallRecording(deviceId!, rec.id.toString());
  };

  // ---------------------------------------------------

  if (isError) {
    return <Typography color="error">Failed to load recordings</Typography>;
  }

  // ---------------------------------------------------

  return (
    <ErrorBoundary>

      <Box>

        {/* Header */}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >

          <Typography variant="h5">
            Call Recordings
          </Typography>

          <Box display="flex" gap={2}>

            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

            <IconButton onClick={() => refetch()}>
              <Refresh />
            </IconButton>

          </Box>

        </Box>

        {/* Content */}

        {isLoading ? (

          <Box textAlign="center" py={6}>
            <CircularProgress />
          </Box>

        ) : recordings.length === 0 ? (

          <Typography textAlign="center">
            No recordings found
          </Typography>

        ) : (

          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
            gap={3}
          >

            {recordings.map(rec => (

              <Card key={rec.id}>

                <CardMedia
                  component="img"
                  height="120"
                  image="/placeholder-recording.jpg"
                />

                <CardContent>

                  <Typography variant="subtitle1" noWrap>
                    {rec.contactName || rec.phoneNumber}
                  </Typography>

                  <Chip
                    size="small"
                    label={rec.status || 'completed'}
                    sx={{ mt: 1 }}
                  />

                  <Typography variant="body2" mt={1}>
                    Duration: {rec.duration}s
                  </Typography>

                  <Typography variant="body2">
                    Size: {(rec.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mt={2}>

                    <IconButton onClick={() => handlePlay(rec)}>
                      {playing && selected?.id === rec.id
                        ? <Pause />
                        : <PlayArrow />}
                    </IconButton>

                    <IconButton onClick={() => handleDownload(rec)}>
                      <Download />
                    </IconButton>

                    <IconButton
                      onClick={() => {
                        setSelected(rec);
                        setDeleteOpen(true);
                      }}
                    >
                      <Delete color="error" />
                    </IconButton>

                  </Box>

                </CardContent>

              </Card>

            ))}

          </Box>

        )}

        {/* Delete dialog */}

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>

          <DialogTitle>Delete Recording</DialogTitle>

          <DialogContent>
            Are you sure you want to delete this recording?
          </DialogContent>

          <DialogActions>

            <Button onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
            >
              Delete
            </Button>

          </DialogActions>

        </Dialog>

      </Box>

    </ErrorBoundary>
  );
};

export default CallRecordings;
