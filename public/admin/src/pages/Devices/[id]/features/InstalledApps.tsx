import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';

import {
  Search,
  Refresh,
  MoreVert,
  Delete,
  GetApp,
  Visibility,
  Block
} from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getInstalledApps,
  uninstallApp,
  disableApp
} from '../../../../services/installedApps';

import {
    launchApp
} from '../../../../services/appService';

import type { AppInfo } from '../../../../services/installedApps';


// ------------------------------------------------------

const InstalledApps = () => {

  const { id: deviceId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);


  // ------------------ QUERY ------------------

  const {
    data: apps = [],
    isLoading,
    isError,
    refetch
  } = useQuery<AppInfo[]>({

    queryKey: ['installedApps', deviceId],

    queryFn: () => getInstalledApps(deviceId!),

    enabled: !!deviceId
  });


  // ------------------ FILTER + PAGINATION ------------------

  const filteredApps = useMemo(() => {

    return apps.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  }, [apps, searchTerm]);


  const paginatedApps = useMemo(() => {

    const start = page * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredApps.slice(start, end);

  }, [filteredApps, page, rowsPerPage]);


  // ------------------ MUTATIONS ------------------

  const uninstallMutation = useMutation({

    mutationFn: (packageName: string) =>
      uninstallApp(deviceId!, packageName),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installedApps', deviceId] });
      enqueueSnackbar('App uninstalled', { variant: 'success' });
    }
  });


  const blockMutation = useMutation({

    mutationFn: (packageName: string) =>
      disableApp(deviceId!, packageName),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installedApps', deviceId] });
      enqueueSnackbar('App disabled', { variant: 'success' });
    }
  });


  const launchMutation = useMutation({

    mutationFn: (packageName: string) =>
      launchApp(deviceId!, packageName),

    onSuccess: () => {
      enqueueSnackbar('App launched', { variant: 'success' });
    }
  });


  // ------------------ HANDLERS ------------------

  const openMenu = (event: React.MouseEvent<HTMLElement>, app: AppInfo) => {
    setAnchorEl(event.currentTarget);
    setSelectedApp(app);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };


  // ------------------ UI ------------------

  if (isError) {
    return (
      <Typography color="error">
        Failed to load installed applications
      </Typography>
    );
  }


  return (

    <Box>

      {/* Header */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >

        <Typography variant="h5">
          Installed Applications
        </Typography>

        <Box display="flex" gap={2}>

          <TextField
            size="small"
            placeholder="Search apps..."
            value={searchTerm}
            onChange={handleSearch}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }
            }}
          />

          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>

        </Box>

      </Box>


      {/* Table */}

      <TableContainer component={Paper}>

        <Table>

          <TableHead>
            <TableRow>
              <TableCell>App Name</TableCell>
              <TableCell>Package</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Installed</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>


          <TableBody>

            {isLoading ? (

              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>

            ) : paginatedApps.length === 0 ? (

              <TableRow>
                <TableCell colSpan={7} align="center">
                  No apps found
                </TableCell>
              </TableRow>

            ) : (

              paginatedApps.map(app => (

                <TableRow key={app.packageName}>

                  <TableCell>{app.name}</TableCell>

                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {app.packageName}
                    </Typography>
                  </TableCell>

                  <TableCell>{app.versionName || '-'}</TableCell>

                  <TableCell>
                    {app.size
                      ? `${(app.size / 1024 / 1024).toFixed(2)} MB`
                      : 'N/A'}
                  </TableCell>

                  <TableCell>
                    {new Date(app.firstInstallTime).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    {app.isEnabled ? (
                      <Chip label="Enabled" color="success" size="small" />
                    ) : (
                      <Chip label="Disabled" size="small" />
                    )}
                  </TableCell>

                  <TableCell align="right">

                    <Tooltip title="Launch">
                      <IconButton
                        size="small"
                        onClick={() => launchMutation.mutate(app.packageName)}
                        disabled={!app.isEnabled}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <IconButton
                      size="small"
                      onClick={e => openMenu(e, app)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>

                  </TableCell>

                </TableRow>

              ))

            )}

          </TableBody>

        </Table>

      </TableContainer>


      {/* Pagination */}

      <TablePagination
        component="div"
        count={filteredApps.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />


      {/* Action Menu */}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
      >

        <MenuItem
          onClick={() => {
            if (selectedApp) launchMutation.mutate(selectedApp.packageName);
            closeMenu();
          }}
          disabled={!selectedApp?.isEnabled}
        >
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>Launch</ListItemText>
        </MenuItem>


        <MenuItem
          onClick={() => {
            if (selectedApp) blockMutation.mutate(selectedApp.packageName);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <Block fontSize="small" />
          </ListItemIcon>
          <ListItemText>Disable</ListItemText>
        </MenuItem>


        <Divider />


        <MenuItem
          onClick={() => {
            if (selectedApp) uninstallMutation.mutate(selectedApp.packageName);
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Uninstall</ListItemText>
        </MenuItem>

      </Menu>

    </Box>
  );
};

export default InstalledApps;
