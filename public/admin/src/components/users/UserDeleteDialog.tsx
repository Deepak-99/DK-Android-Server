import { useState, type FC } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  Box,
  CircularProgress,
  useTheme
} from '@mui/material';

import { Warning as WarningIcon } from '@mui/icons-material';
import { User } from '../../types/user';

interface UserDeleteDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
}

const UserDeleteDialog: FC<UserDeleteDialogProps> = ({
  open,
  user,
  onClose,
  onConfirm,
  loading = false
}) => {

  const theme = useTheme();
  const [confirmText, setConfirmText] = useState('');

  const handleConfirm = async () => {
    if (!user) return;

    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch {
      // handled by parent
    }
  };

  if (!user) return null;

  const isMatch = confirmText === user.username;

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >

      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="error" />
          <span>Delete User</span>
        </Box>
      </DialogTitle>

      <DialogContent>

        <DialogContentText>
          Are you sure you want to delete user{' '}
          <Typography component="span" fontWeight="bold">
            {user.username}
          </Typography>
          ? This action cannot be undone.
        </DialogContentText>

        <Box
          mt={3}
          p={2}
          borderRadius={1}
          sx={{
            bgcolor: theme.palette.warning.light
          }}
        >
          <Typography variant="body2" color="warning.dark">
            <strong>Warning:</strong> This will permanently delete:
          </Typography>

          <Box component="ul" pl={3} mt={1} mb={0}>
            <li>User profile information</li>
            <li>Associated files</li>
            <li>Activity history</li>
            <li>Settings & preferences</li>
          </Box>
        </Box>

        <Box mt={3}>
          <Typography variant="body2" color="text.secondary">
            Type <strong>{user.username}</strong> to confirm:
          </Typography>

          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Enter username"
            style={{
              width: '100%',
              marginTop: 8,
              padding: '8px 12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
              fontSize: 14
            }}
          />
        </Box>

      </DialogContent>

      <DialogActions>

        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          onClick={handleConfirm}
          disabled={loading || !isMatch}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} /> : undefined}
        >
          {loading ? 'Deleting...' : 'Delete User'}
        </Button>

      </DialogActions>

    </Dialog>
  );
};

export default UserDeleteDialog;
