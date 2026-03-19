import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { Send, Refresh, Delete, ChatBubble } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    getSMSThreads,
    sendSMS,
    deleteSMSMessage,
    SMSThread,
} from '../../../../services/sms';

const SMS = () => {
    const { id: deviceId } = useParams<{ id: string }>();
    const [message, setMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    /* -----------------------------
       FETCH SMS THREADS (v5 syntax)
    ------------------------------*/
    const {
        data: messages = [],
        isLoading,
        refetch,
    } = useQuery<SMSThread[]>({
        queryKey: ['sms', deviceId],
        queryFn: () => getSMSThreads(deviceId!),
        enabled: !!deviceId,
        refetchOnWindowFocus: false,
    });

    /* -----------------------------
       SEND SMS
    ------------------------------*/
    const sendMutation = useMutation({
        mutationFn: () => sendSMS(deviceId!, phoneNumber, message),
        onSuccess: () => {
            refetch();
            setMessage('');
            setPhoneNumber('');
            enqueueSnackbar('Message sent', { variant: 'success' });
        },
        onError: () => {
            enqueueSnackbar('Failed to send message', { variant: 'error' });
        },
    });

    /* -----------------------------
       DELETE SMS
    ------------------------------*/
    const deleteMutation = useMutation({
        mutationFn: (messageId: string) =>
            deleteSMSMessage(deviceId!, messageId),
        onSuccess: () => {
            refetch();
            enqueueSnackbar('Message deleted', { variant: 'success' });
        },
        onError: () => {
            enqueueSnackbar('Failed to delete message', { variant: 'error' });
        },
    });

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                SMS Messages
            </Typography>

            {/* Send SMS */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        endIcon={<Send />}
                        onClick={() => sendMutation.mutate()}
                        disabled={!phoneNumber || !message || sendMutation.isPending}
                    >
                        Send
                    </Button>
                </Box>

                <TextField
                    label="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                />
            </Paper>

            {/* Message List */}
            <Paper>
                <Box
                    p={2}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant="h6">Message Threads</Typography>
                    <IconButton onClick={() => refetch()} disabled={isLoading}>
                        <Refresh />
                    </IconButton>
                </Box>

                <Divider />

                {isLoading ? (
                    <Box p={3} textAlign="center">
                        <CircularProgress />
                    </Box>
                ) : (
                    <List>
                        {messages.map((msg: SMSThread) => (
                            <div key={msg.id}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleDelete(msg.id)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={msg.snippet}
                                        secondary={`${msg.address} • ${new Date(
                                            msg.date
                                        ).toLocaleString()}`}
                                    />
                                </ListItem>
                                <Divider component="li" />
                            </div>
                        ))}
                    </List>
                )}
            </Paper>
        </Box>
    );
};

export default SMS;