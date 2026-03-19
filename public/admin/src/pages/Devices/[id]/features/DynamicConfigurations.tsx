import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';

import { Refresh, Add, Delete } from '@mui/icons-material';

import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  getConfigurations,
  saveConfiguration,
  deleteConfiguration,
  DynamicConfig
} from '../../../../services/configuration';

const DynamicConfigurations = () => {

  const { id: deviceId } = useParams<{ id: string }>();

  const { enqueueSnackbar } = useSnackbar();

  const [scope, setScope] = useState('app');

  const [newConfig, setNewConfig] = useState({
    key: '',
    value: '',
    type: 'string',
    description: ''
  });

  /* ---------------- QUERY ---------------- */

  const {
    data: configs = [],
    isLoading,
    isError,
    refetch
  } = useQuery<DynamicConfig[]>({

    queryKey: ['configs', deviceId, scope],

    queryFn: () => getConfigurations(deviceId!, scope),

    enabled: !!deviceId
  });

  /* ---------------- MUTATIONS ---------------- */

  const saveMutation = useMutation({

    mutationFn: (payload: Partial<DynamicConfig>) =>
      saveConfiguration(deviceId!, scope, payload),

    onSuccess: () => {
      refetch();
      enqueueSnackbar('Configuration saved', { variant: 'success' });
    }
  });

  const deleteMutation = useMutation({

    mutationFn: (configId: string) =>
      deleteConfiguration(deviceId!, scope, configId),

    onSuccess: () => {
      refetch();
      enqueueSnackbar('Configuration deleted', { variant: 'success' });
    }
  });

  /* ---------------- HANDLERS ---------------- */

  const handleAdd = () => {

    if (!newConfig.key || !newConfig.value) {
      enqueueSnackbar('Key and Value required', { variant: 'warning' });
      return;
    }

    saveMutation.mutate(newConfig);

    setNewConfig({
      key: '',
      value: '',
      type: 'string',
      description: ''
    });
  };

  const handleUpdate = (config: DynamicConfig, value: any) => {

    saveMutation.mutate({
      ...config,
      value
    });
  };

  const handleDelete = (id: string) => {

    if (!window.confirm('Delete configuration?')) return;

    deleteMutation.mutate(id);
  };

  /* ---------------- UI ---------------- */

  return (

    <Box>

      {/* HEADER */}

      <Box
        display="flex"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h5">
          Dynamic Configurations
        </Typography>

        <Button
          startIcon={<Refresh />}
          onClick={() => refetch()}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>

        {/* SCOPE SELECT */}

        <FormControl size="small" sx={{ minWidth: 220 }}>

          <InputLabel>Configuration Scope</InputLabel>

          <Select
            value={scope}
            label="Configuration Scope"
            onChange={e => setScope(e.target.value)}
          >
            <MenuItem value="app">Application</MenuItem>
            <MenuItem value="device">Device</MenuItem>
            <MenuItem value="network">Network</MenuItem>
            <MenuItem value="security">Security</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>

        </FormControl>

        <Divider sx={{ my: 3 }} />

        {/* ADD CONFIG */}

        <Typography variant="h6" mb={2}>
          Add Configuration
        </Typography>

        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '2fr 2fr 1fr 2fr auto' }}
          gap={2}
        >

          <TextField
            label="Key"
            size="small"
            value={newConfig.key}
            onChange={e =>
              setNewConfig({ ...newConfig, key: e.target.value })
            }
          />

          <TextField
            label="Value"
            size="small"
            value={newConfig.value}
            onChange={e =>
              setNewConfig({ ...newConfig, value: e.target.value })
            }
          />

          <FormControl size="small">

            <InputLabel>Type</InputLabel>

            <Select
              value={newConfig.type}
              label="Type"
              onChange={e =>
                setNewConfig({ ...newConfig, type: e.target.value })
              }
            >
              <MenuItem value="string">String</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>

          </FormControl>

          <TextField
            label="Description"
            size="small"
            value={newConfig.description}
            onChange={e =>
              setNewConfig({ ...newConfig, description: e.target.value })
            }
          />

          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={handleAdd}
          >
            Add
          </Button>

        </Box>

        <Divider sx={{ my: 3 }} />

        {/* LIST */}

        {isLoading && (
          <Box textAlign="center" p={3}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Alert severity="error">
            Failed to load configurations
          </Alert>
        )}

        {!isLoading && configs.length === 0 && (
          <Typography textAlign="center">
            No configurations found
          </Typography>
        )}

        <Box display="grid" gap={2}>

          {configs.map(config => (

            <Card key={config.id} variant="outlined">

              <CardHeader
                title={config.key}
                subheader={config.description}
                action={
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(config.id)}
                  >
                    <Delete />
                  </IconButton>
                }
              />

              <CardContent>

                {config.type === 'boolean' ? (

                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.value === true || config.value === 'true'}
                        onChange={e =>
                          handleUpdate(config, e.target.checked.toString())
                        }
                      />
                    }
                    label={
                      config.value === true || config.value === 'true'
                        ? 'Enabled'
                        : 'Disabled'
                    }
                  />

                ) : (

                  <TextField
                    fullWidth
                    size="small"
                    value={config.value}
                    type={config.type === 'number' ? 'number' : 'text'}
                    multiline={config.type === 'json'}
                    minRows={config.type === 'json' ? 3 : 1}
                    onChange={e =>
                      handleUpdate(config, e.target.value)
                    }
                  />

                )}

              </CardContent>

            </Card>

          ))}

        </Box>

      </Paper>

    </Box>
  );
};

export default DynamicConfigurations;
