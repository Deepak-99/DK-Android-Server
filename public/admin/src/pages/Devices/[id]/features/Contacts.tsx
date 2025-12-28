import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, TextField, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination,
    IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, Divider, Chip, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Search, Phone, Email, Person } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContacts, addContact, updateContact, deleteContact } from '../../../services/contacts';

const Contacts = () => {
    const { id: deviceId } = useParams();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    const { data: contacts = [], isLoading } = useQuery(
        ['contacts', deviceId, page, rowsPerPage, searchTerm],
        () => getContacts(deviceId!, { page: page + 1, limit: rowsPerPage, search: searchTerm }),
        { keepPreviousData: true }
    );

    // Add CRUD operations using useMutation

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">Contacts</Typography>
                <Box display="flex" gap={2}>
                    <TextField
                        size="small"
                        placeholder="Search contacts..."
                        InputProps={{ startAdornment: <Search /> }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Add Contact
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No contacts found
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell>{contact.name}</TableCell>
                                    <TableCell>{contact.phone}</TableCell>
                                    <TableCell>{contact.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(contact)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(contact.id)}>
                                            <Delete fontSize="small" color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={contacts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                }}
            />

            {/* Add/Edit Contact Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>
                    {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </DialogTitle>
                <DialogContent>
                    {/* Form fields for contact */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveContact}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Contacts;