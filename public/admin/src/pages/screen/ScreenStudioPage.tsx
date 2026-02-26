import { Box, Button, Paper, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";

export default function ScreenStudioPage() {

    const { id: deviceId } = useParams();
    const [streaming,setStreaming]=useState(false);
    const [recording,setRecording]=useState(false);

    const startProjection = async()=>{
        await api.post("/screen-projection/start",{device_id:deviceId});
        setStreaming(true);
    };

    const stopProjection = async()=>{
        await api.post("/screen-projection/stop",{device_id:deviceId});
        setStreaming(false);
    };

    const startRecording = async()=>{
        await api.post(`/devices/${deviceId}/screen-recordings/start`);
        setRecording(true);
    };

    const stopRecording = async()=>{
        await api.post(`/devices/${deviceId}/screen-recordings/stop`);
        setRecording(false);
    };

    return(
        <Box>

            <Typography variant="h5" mb={2}>Screen Studio</Typography>

            <Box display="flex" gap={2} mb={2}>
                <Button variant="contained" onClick={startProjection}>Start Projection</Button>
                <Button variant="outlined" onClick={stopProjection}>Stop Projection</Button>
                <Button variant="contained" color="secondary" onClick={startRecording}>Start Recording</Button>
                <Button variant="outlined" color="secondary" onClick={stopRecording}>Stop Recording</Button>
            </Box>

            <Paper sx={{height:420,background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <video id="screen-video" autoPlay style={{width:"100%"}}/>
            </Paper>

        </Box>
    );
}
