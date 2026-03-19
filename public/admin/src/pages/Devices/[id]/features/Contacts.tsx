import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  Contact
} from '../../../../services/contacts';

/* ---------------- TYPES ---------------- */

interface PaginationInfo {
  total: number;
  page: number;
  totalPages: number;
}

interface PaginatedContactsResponse {
  success: boolean;
  data: Contact[];
  pagination: PaginationInfo;
}

/* ---------------- COMPONENT ---------------- */

const Contacts = () => {
  const { id: deviceId } = useParams<{ id: string }>();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  /* ---------------- FETCH CONTACTS ---------------- */

  const {
    data,
    isLoading,
    isError
  } = useQuery<PaginatedContactsResponse>({
    queryKey: ['contacts', deviceId, page, rowsPerPage, searchTerm],

    queryFn: () =>
      getContacts(deviceId!, {
        searchQuery: searchTerm,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      }) as unknown as Promise<PaginatedContactsResponse>,

    enabled: !!deviceId,

    placeholderData: (prev) => prev
  });

  const contacts = data?.data || [];
  const total = data?.pagination?.total || 0;

  /* ---------------- MUTATIONS ---------------- */

  const createMutation = useMutation({
    mutationFn: (payload: any) => createContact(deviceId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      enqueueSnackbar('Contact added successfully', { variant: 'success' });
      setOpenDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateContact(deviceId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      enqueueSnackbar('Contact updated successfully', { variant: 'success' });
      setOpenDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) =>
      deleteContact(deviceId!, contactId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      enqueueSnackbar('Contact deleted', { variant: 'success' });
    }
  });

  /* ---------------- HANDLERS ---------------- */

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setOpenDialog(true);
  };

  const handleDelete = (contactId: string) => {
    deleteMutation.mutate(contactId);
  };

  const handleSaveContact = () => {
    const payload = {
      displayName: editingContact?.displayName || 'New Contact',
      phoneNumbers: [],
      emails: [],
      addresses: [],
      organizations: [],
      websites: [],
      socialProfiles: [],
      groups: [],
      starred: false,
      timesContacted: 0,
      isUserProfile: false,
      inDefaultDirectory: true,
      inVisibleGroup: true,
      hasPhoneNumber: false,
      hasEmail: false
    };

    if (editingContact) {
      updateMutation.mutate({
        id: editingContact.id,
        data: payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  /* ---------------- UI ---------------- */

  if (isError) {
    return <Typography color="error">Failed to load contacts</Typography>;
  }

  return (
    <Box>

      {/* HEADER */}

      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5">Contacts</Typography>

        <Box display="flex" gap={2}>
          <TextField
            size="small"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingContact(null);
              setOpenDialog(true);
            }}
          >
            Add Contact
          </Button>
        </Box>
      </Box>

      {/* TABLE */}

      <TableContainer component={Paper}>
        <Table>

          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phones</TableCell>
              <TableCell>Emails</TableCell>
              <TableCell width={120}>Actions</TableCell>
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
              contacts.map((contact: Contact) => (
                <TableRow key={contact.id}>

                  <TableCell>{contact.displayName}</TableCell>

                  <TableCell>
                    {contact.phoneNumbers?.[0]?.number || '-'}
                  </TableCell>

                  <TableCell>
                    {contact.emails?.[0]?.address || '-'}
                  </TableCell>

                  <TableCell>
                    <IconButton onClick={() => handleEdit(contact)}>
                      <Edit fontSize="small" />
                    </IconButton>

                    <IconButton
                      onClick={() => handleDelete(contact.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>

                </TableRow>
              ))
            )}

          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION */}

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      {/* ADD / EDIT DIALOG */}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>

        <DialogTitle>
          {editingContact ? 'Edit Contact' : 'Add Contact'}
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Simple demo form — you can extend fields later.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveContact}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Save
          </Button>
        </DialogActions>

      </Dialog>

    </Box>
  );
};

export default Contacts;
