import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, Button, IconButton,
    CircularProgress, Grid, Slider, Tooltip
} from '@mui/material';
import {
    PlayArrow, Stop, Refresh, Fullscreen,
    FullscreenExit, ZoomIn, ZoomOut
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { startScreenCapture, stopScreenCapture, getScreenCaptureStatus } from '../../../services/screenCapture';

const ScreenProjections = () => {
    const { id: deviceId } = useParams();
    const [isStreaming, setIsStreaming] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(100);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { enqueueSnackbar } = useSnackbar();

    const { data: streamStatus, refetch } = useQuery(
        ['screenCaptureStatus', deviceId],
        () => getScreenCaptureStatus(deviceId!),
        {
            enabled: isStreaming,
            refetchInterval: 3000,
        }
    );

    const startStream = async () => {
        try {
            const streamUrl = await startScreenCapture(deviceId!);
            if (videoRef.current) {
                videoRef.current.src = streamUrl;
                videoRef.current.play().catch(e => {
                    enqueueSnackbar('Failed to start video playback', { variant: 'error' });
                    console.error('Video play error:', e);
                });
            }
            setIsStreaming(true);
        } catch (error) {
            enqueueSnackbar('Failed to start screen capture', { variant: 'error' });
        }
    };

    const stopStream = async () => {
        try {
            await stopScreenCapture(deviceId!);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.src = '';
            }
            setIsStreaming(false);
        } catch (error) {
            enqueueSnackbar('Failed to stop screen capture', { variant: 'error' });
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.requestFullscreen().catch(e => {
                console.error('Fullscreen error:', e);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5">Screen Projection</Typography>
                <Box>
                    <Tooltip title={isStreaming ? 'Stop' : 'Start'}>
                        <IconButton
                            color={isStreaming ? 'error' : 'primary'}
                            onClick={isStreaming ? stopStream : startStream}
                            sx={{ mr: 1 }}
                        >
                            {isStreaming ? <Stop /> : <PlayArrow />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                        <IconButton onClick={() => refetch()} disabled={!isStreaming}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Paper
                sx={{
                    position: 'relative',
                    backgroundColor: 'black',
                    overflow: 'hidden',
                    aspectRatio: '16/9',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {isStreaming ? (
                    <video
                        ref={videoRef}
                        style={{
                            width: `${zoom}%`,
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                        }}
                        controls={false}
                        autoPlay
                        playsInline
                        muted
                    />
                ) : (
                    <Typography color="text.secondary">
                        Click the play button to start screen projection
                    </Typography>
                )}

                {isStreaming && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            right: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            p: 1,
                            borderRadius: 1,
                        }}
                    >
                        <Box sx={{ width: 200, display: 'flex', alignItems: 'center' }}>
                            <ZoomOut fontSize="small" sx={{ mr: 1 }} />
                            <Slider
                                value={zoom}
                                onChange={(_, value) => setZoom(value as number)}
                                min={25}
                                max={200}
                                step={25}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}%`}
                                sx={{ color: 'white' }}
                            />
                            <ZoomIn fontSize="small" sx={{ ml: 1 }} />
                        </Box>

                        <Box>
                            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                                <IconButton
                                    onClick={toggleFullscreen}
                                    sx={{ color: 'white' }}
                                >
                                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                )}
            </Paper>

            {streamStatus && (
                <Box mt={2}>
                    <Typography variant="subtitle2">Stream Info</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Resolution: {streamStatus.resolution} | FPS: {streamStatus.fps} |
                        Bitrate: {streamStatus.bitrate} kbps | Status: {streamStatus.status}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default ScreenProjections;