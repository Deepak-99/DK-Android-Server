import { useState, type FC, type MouseEvent } from 'react';
import {
    Box,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Chip,
    Tooltip,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
} from '@mui/material';

import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  FileDownload as ExportIcon,
  Group as GroupIcon,
  LockReset as ResetPasswordIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { User } from '../../types/user';

interface UserBulkActionsProps {
  selectedUsers: string[];
  onDelete: (userIds: string[]) => Promise<void>;
  onStatusChange: (userIds: string[], isActive: boolean) => Promise<void>;
  onExport: (userIds: string[]) => void;
  onSendEmail: (userIds: string[]) => void;
  onResetPassword: (userIds: string[]) => Promise<void>;
  onAddToGroup: (userIds: string[]) => void;
  disabled?: boolean;
}

const UserBulkActions: FC<UserBulkActionsProps> = ({
  selectedUsers,
  onDelete,
  onStatusChange,
  onExport,
  onSendEmail,
  onResetPassword,
  onAddToGroup,
  disabled = false
}) => {

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);

  const [statusDialog, setStatusDialog] = useState({
    open: false,
    isActive: false
  });

  const [loading, setLoading] = useState(false);

  const selectedCount = selectedUsers.length;

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleStatusClick = (isActive: boolean) => {
    handleMenuClose();
    setStatusDialog({ open: true, isActive });
  };

  const handleResetPasswordClick = () => {
    handleMenuClose();
    setResetPasswordDialog(true);
  };

  const handleConfirmAction = async (action: () => Promise<void>) => {
    try {
      setLoading(true);
      await action();
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setResetPasswordDialog(false);
      setStatusDialog({ open: false, isActive: false });
    }
  };

  const handleExportClick = () => {
    handleMenuClose();
    onExport(selectedUsers);
  };

  const handleSendEmailClick = () => {
    handleMenuClose();
    onSendEmail(selectedUsers);
  };

  const handleAddToGroupClick = () => {
    handleMenuClose();
    onAddToGroup(selectedUsers);
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>

      <Chip
        label={`${selectedCount} selected`}
        color="primary"
        size="small"
        sx={{ mr: 1 }}
      />

      <Tooltip title="More actions">
        <span>
          <Button
            variant="outlined"
            size="small"
            onClick={handleMenuOpen}
            disabled={disabled || selectedCount === 0}
            startIcon={<MoreVertIcon />}
          >
            Actions
          </Button>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >

        <MenuItem onClick={() => handleStatusClick(true)}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="Activate Users" />
        </MenuItem>

        <MenuItem onClick={() => handleStatusClick(false)}>
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Deactivate Users" />
        </MenuItem>

        <MenuItem onClick={handleResetPasswordClick}>
          <ListItemIcon>
            <ResetPasswordIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Reset Password" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleAddToGroupClick}>
          <ListItemIcon>
            <GroupIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Add to Group" />
        </MenuItem>

        <MenuItem onClick={handleSendEmailClick}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Send Email" />
        </MenuItem>

        <MenuItem onClick={handleExportClick}>
          <ListItemIcon>
            <ExportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Export Users" />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete Users" />
        </MenuItem>

      </Menu>

      {/* DELETE CONFIRMATION */}
      <Dialog open={deleteDialogOpen} onClose={() => !loading && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {selectedCount} Users?</DialogTitle>

        <DialogContent>
          <DialogContentText>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            startIcon={<CloseIcon />}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <DeleteIcon />}
            onClick={() => handleConfirmAction(() => onDelete(selectedUsers))}
          >
            Delete Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* STATUS DIALOG */}
      <Dialog open={statusDialog.open} onClose={() => !loading && setStatusDialog({ open: false, isActive: false })}>

        <DialogTitle>
          {statusDialog.isActive ? 'Activate' : 'Deactivate'} Users
        </DialogTitle>

        <DialogActions>

          <Button
            onClick={() => setStatusDialog({ open: false, isActive: false })}
            startIcon={<CloseIcon />}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={loading}
            color={statusDialog.isActive ? 'success' : 'warning'}
            startIcon={
              loading
                ? <CircularProgress size={18} />
                : statusDialog.isActive
                  ? <CheckIcon />
                  : <BlockIcon />
            }
            onClick={() =>
              handleConfirmAction(() =>
                onStatusChange(selectedUsers, statusDialog.isActive)
              )
            }
          >
            Confirm
          </Button>

        </DialogActions>

      </Dialog>

      {/* RESET PASSWORD */}
      <Dialog open={resetPasswordDialog} onClose={() => !loading && setResetPasswordDialog(false)}>

        <DialogTitle>Reset Password</DialogTitle>

        <DialogActions>

          <Button
            onClick={() => setResetPasswordDialog(false)}
            startIcon={<CloseIcon />}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <ResetPasswordIcon />}
            onClick={() => handleConfirmAction(() => onResetPassword(selectedUsers))}
          >
            Reset Passwords
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
};

export default UserBulkActions;
