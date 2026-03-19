import { useState } from "react";
import { useParams } from "react-router-dom";
import WebRTCViewer from "../../../../components/webrtc/WebRTCViewer";

import {
    Box,
    Typography,
    Paper,
    IconButton,
    Slider,
    Tooltip
} from "@mui/material";

import {
    PlayArrow,
    Stop,
    Refresh,
    Fullscreen,
    FullscreenExit,
    ZoomIn,
    ZoomOut
} from "@mui/icons-material";

import { useSnackbar } from "notistack";
import { useQuery } from "@tanstack/react-query";

import {
    startScreenCapture,
    stopScreenCapture,
    getScreenCaptureStatus,
    ScreenCaptureStatus
} from "../../../../services/screenCapture";

/* ✅ H264 WebCodecs Viewer */
import H264Viewer from "../../../../components/stream/H264Viewer";

const ScreenProjections = () => {

    const { id: deviceId } = useParams();
    const { enqueueSnackbar } = useSnackbar();

    const [isStreaming, setIsStreaming] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoom, setZoom] = useState(100);

    /* ----------------------------------------------------
       STREAM STATUS POLLING
    ---------------------------------------------------- */

    const {
        data: streamStatus,
        refetch
    } = useQuery<ScreenCaptureStatus>({
        queryKey: ["screenCaptureStatus", deviceId],
        queryFn: () => getScreenCaptureStatus(deviceId!),
        enabled: isStreaming && !!deviceId,
        refetchInterval: 3000
    });

    /* ----------------------------------------------------
       START STREAM
    ---------------------------------------------------- */

    const startStream = async () => {
        try {

            await startScreenCapture(deviceId!);

            setIsStreaming(true);

        } catch {

            enqueueSnackbar(
                "Failed to start projection",
                { variant: "error" }
            );
        }
    };

    /* ----------------------------------------------------
       STOP STREAM
    ---------------------------------------------------- */

    const stopStream = async () => {

        try {

            await stopScreenCapture(deviceId!);

            setIsStreaming(false);

        } catch {

            enqueueSnackbar(
                "Failed to stop projection",
                { variant: "error" }
            );
        }
    };

    /* ----------------------------------------------------
       FULLSCREEN
    ---------------------------------------------------- */

    const toggleFullscreen = async () => {

        const container =
            document.getElementById("stream-container");

        if (!document.fullscreenElement) {

            await container?.requestFullscreen();
            setIsFullscreen(true);

        } else {

            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    /* ====================================================
       UI
    ==================================================== */

    return (
        <Box>

            {/* HEADER */}
            <Box
                display="flex"
                justifyContent="space-between"
                mb={2}
            >
                <Typography variant="h5">
                    Screen Projection
                </Typography>

                <Box>

                    <Tooltip title={isStreaming ? "Stop" : "Start"}>
                        <IconButton
                            color={isStreaming ? "error" : "primary"}
                            onClick={
                                isStreaming
                                    ? stopStream
                                    : startStream
                            }
                        >
                            {isStreaming
                                ? <Stop />
                                : <PlayArrow />}
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Refresh">
                        <IconButton
                            onClick={() => refetch()}
                            disabled={!isStreaming}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>

                </Box>
            </Box>

            {/* STREAM AREA */}
            <Paper
                id="stream-container"
                sx={{
                    position: "relative",
                    backgroundColor: "black",
                    aspectRatio: "16/9",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >

                {isStreaming ? (

                    <Box
                        sx={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: "center",
                            width: "100%",
                            height: "100%"
                        }}
                    >
                        <WebRTCViewer deviceId={deviceId!} />
                    </Box>

                ) : (

                    <Typography
                        color="text.secondary"
                        sx={{ p: 3 }}
                    >
                        Click play to start screen projection
                    </Typography>

                )}

                {/* CONTROLS */}
                {isStreaming && (

                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 16,
                            left: 16,
                            right: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            backgroundColor: "rgba(0,0,0,0.5)",
                            p: 1,
                            borderRadius: 1
                        }}
                    >

                        {/* ZOOM */}
                        <Box
                            sx={{
                                width: 220,
                                display: "flex",
                                alignItems: "center"
                            }}
                        >

                            <ZoomOut />

                            <Slider
                                value={zoom}
                                onChange={(_, v) =>
                                    setZoom(v as number)
                                }
                                min={25}
                                max={200}
                            />

                            <ZoomIn />

                        </Box>

                        {/* FULLSCREEN */}
                        <IconButton
                            onClick={toggleFullscreen}
                            sx={{ color: "white" }}
                        >
                            {isFullscreen
                                ? <FullscreenExit />
                                : <Fullscreen />}
                        </IconButton>

                    </Box>

                )}

            </Paper>

            {/* STATUS */}
            {streamStatus && (

                <Box mt={2}>

                    <Typography variant="subtitle2">
                        Stream Info
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >

                        Resolution: {streamStatus.resolution}
                        {" | "}
                        FPS: {streamStatus.fps}
                        {" | "}
                        Bitrate: {streamStatus.bitrate}
                        {" kbps | "}
                        Status: {streamStatus.status}

                    </Typography>

                </Box>

            )}

        </Box>
    );
};

export default ScreenProjections;
