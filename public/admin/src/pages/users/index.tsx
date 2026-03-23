import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { User } from '../../types/user';
import { userService } from '../../services/userService';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAllUsers();
            setUsers(data || []);
        } catch (error) {
            enqueueSnackbar("Failed to fetch users", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

  useEffect(() => {
    fetchUsers();
  }, []);

    const handleDelete = async (userId: number | string) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await userService.deleteUser(String(userId));
            enqueueSnackbar("User deleted successfully", { variant: "success" });
            fetchUsers();
        } catch (error) {
            enqueueSnackbar("Failed to delete user", { variant: "error" });
        }
    };

  const filteredUsers = users.filter((user) =>
    (user.username || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    (user.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          alignItems: "center"
        }}
      >
        <Typography variant="h4">User Management</Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/users/create")}
        >
          Add User
        </Button>
      </Box>

      {/* SEARCH */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={fetchUsers}>
                  <RefreshIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* TABLE */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography>No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>

                      <Box>
                        <Typography>{user.username}</Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {user.fullName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>{user.email}</TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor:
                          user.role === "admin"
                            ? "primary.light"
                            : "grey.200",
                        color:
                          user.role === "admin"
                            ? "primary.contrastText"
                            : "text.primary"
                      }}
                    >
                      {user.role}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        "&::before": {
                          content: '""',
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: user.isActive
                            ? "success.main"
                            : "error.main",
                          mr: 1
                        }
                      }}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Box>
                  </TableCell>

                  <TableCell>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString()
                      : "Never logged in"}
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        onClick={() => navigate(`/users/edit/${user.id}`)}
                        size="small"
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDelete(user.id)}
                        size="small"
                        color="error"
                        disabled={user.role === "admin"}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserList;
