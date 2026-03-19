import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress
} from '@mui/material';

import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';

import {
  getAccessibilitySettings,
  updateAccessibilitySettings,
  type AccessibilitySettings
} from '../../../../services/accessibilityService';

const Accessibility = () => {

  const { id: deviceId } = useParams<{ id: string }>();
  const { enqueueSnackbar } = useSnackbar();

  // -------------------
  // Local State
  // -------------------

  const [settings, setSettings] = useState<AccessibilitySettings>({
    screenReaderEnabled: false,
    displayMagnificationEnabled: false,
    colorInversionEnabled: false,

    colorCorrectionMode: 'disabled',

    touchExplorationEnabled: false,
    highTextContrastEnabled: false,

    autoclickEnabled: false,
    autoclickDelay: 500,

    screenMagnificationEnabled: false,
    screenMagnificationScale: 1,

    screenMagnificationFollowTyping: false,
    screenMagnificationFollowFocus: false,
    screenMagnificationFollowMouse: false,

    screenMagnificationWindowEnabled: false,
    screenMagnificationWindowSize: 200,

    screenMagnificationWindowPosition: { x: 0, y: 0 }
  });

  // -------------------
  // Query
  // -------------------

  const {
    data,
    isLoading,
    isError
  } = useQuery<AccessibilitySettings>({
    queryKey: ['accessibility', deviceId],
    queryFn: () => getAccessibilitySettings(deviceId!),
    enabled: !!deviceId
  });

  // Sync API → UI state
  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  // -------------------
  // Mutation
  // -------------------

  const updateMutation = useMutation<
    AccessibilitySettings,
    Error,
    Partial<AccessibilitySettings>
  >({
    mutationFn: (payload) =>
      updateAccessibilitySettings(deviceId!, payload),

    onSuccess: () => {
      enqueueSnackbar('Accessibility settings updated', {
        variant: 'success'
      });
    },

    onError: () => {
      enqueueSnackbar('Update failed', {
        variant: 'error'
      });
    }
  });

  // -------------------
  // Change Handler
  // -------------------

  const handleChange = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {

    const updated = {
      ...settings,
      [key]: value
    };

    setSettings(updated);

    // PATCH only changed field
    updateMutation.mutate({
      [key]: value
    } as Partial<AccessibilitySettings>);
  };

  // -------------------
  // UI States
  // -------------------

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error">
        Failed to load accessibility settings
      </Typography>
    );
  }

  // -------------------
  // UI
  // -------------------

  return (
    <Box>

      <Typography variant="h5" gutterBottom>
        Accessibility Settings
      </Typography>

      <Paper sx={{ p: 3 }}>

        <Typography variant="h6" gutterBottom>
          Core Features
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={settings.screenReaderEnabled}
              onChange={(e) =>
                handleChange(
                  'screenReaderEnabled',
                  e.target.checked
                )
              }
            />
          }
          label="Screen Reader"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.highTextContrastEnabled}
              onChange={(e) =>
                handleChange(
                  'highTextContrastEnabled',
                  e.target.checked
                )
              }
            />
          }
          label="High Contrast Text"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.touchExplorationEnabled}
              onChange={(e) =>
                handleChange(
                  'touchExplorationEnabled',
                  e.target.checked
                )
              }
            />
          }
          label="Touch Exploration"
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.autoclickEnabled}
              onChange={(e) =>
                handleChange(
                  'autoclickEnabled',
                  e.target.checked
                )
              }
            />
          }
          label="Auto Click"
        />

      </Paper>

    </Box>
  );
};

export default Accessibility;
