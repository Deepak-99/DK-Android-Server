import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Divider,
  Button,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Palette as PaletteIcon,
  FormatColorFill as ColorLensIcon,
  Restore as RestoreIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { ChromePicker, ColorResult } from 'react-color';
import { useTheme as useAppTheme } from '@/theme';

const colorPresets = [
  { name: 'Default', value: '#1976d2' },
  { name: 'Purple', value: '#9c27b0' },
  { name: 'Teal', value: '#009688' },
  { name: 'Orange', value: '#ff9800' },
  { name: 'Red', value: '#f44336' },
  { name: 'Green', value: '#4caf50' },
];

const ThemeSettings: React.FC = () => {
  const theme = useTheme();
  const { mode, setMode, primaryColor, setPrimaryColor } = useAppTheme();
  const [customColor, setCustomColor] = useState(primaryColor);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [layout, setLayout] = useState('default');
  const [dense, setDense] = useState(false);
  const [rounded, setRounded] = useState(true);
  const [shadows, setShadows] = useState(true);
  
  // Update local state when theme changes
  useEffect(() => {
    setCustomColor(primaryColor);
  }, [primaryColor]);

  const handleThemeModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMode(event.target.checked ? 'dark' : 'light');
  };

  const handleColorChange = (color: ColorResult) => {
    setCustomColor(color.hex);
  };

  const handleColorChangeComplete = (color: ColorResult) => {
    setPrimaryColor(color.hex);
  };

  const handlePresetColorSelect = (color: string) => {
    setPrimaryColor(color);
    setCustomColor(color);
  };

  const resetToDefault = () => {
    setMode('light');
    setPrimaryColor('#1976d2');
    setLayout('default');
    setDense(false);
    setRounded(true);
    setShadows(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <PaletteIcon sx={{ mr: 1 }} />
          Theme Customization
        </Typography>
        <Button 
          startIcon={<RestoreIcon />} 
          onClick={resetToDefault}
          size="small"
        >
          Reset to Default
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Theme Mode
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LightModeIcon sx={{ mr: 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={mode === 'dark'}
                    onChange={handleThemeModeChange}
                    color="primary"
                  />
                }
                label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              />
              <DarkModeIcon sx={{ ml: 'auto' }} />
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {mode === 'dark' 
                ? 'Dark mode provides a comfortable viewing experience in low-light conditions.'
                : 'Light mode provides better readability in well-lit environments.'
              }
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Color Scheme
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <FormLabel component="legend" sx={{ mb: 1, display: 'block' }}>
                Primary Color
              </FormLabel>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {colorPresets.map((preset) => (
                  <Tooltip key={preset.name} title={preset.name} arrow>
                    <Box
                      onClick={() => handlePresetColorSelect(preset.value)}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: preset.value,
                        cursor: 'pointer',
                        border: primaryColor === preset.value 
                          ? `2px solid ${theme.palette.primary.main}` 
                          : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          transition: 'transform 0.2s',
                        },
                      }}
                    >
                      {primaryColor === preset.value && (
                        <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                      )}
                    </Box>
                  </Tooltip>
                ))}
                <Tooltip title="Custom color" arrow>
                  <Box
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                      border: '2px solid #ccc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  >
                    <ColorLensIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                </Tooltip>
              </Box>
              
              {showColorPicker && (
                <Box sx={{ mb: 2 }}>
                  <ChromePicker
                    color={customColor}
                    onChange={handleColorChange}
                    onChangeComplete={handleColorChangeComplete}
                  />
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      size="small" 
                      onClick={() => setShowColorPicker(false)}
                      sx={{ mr: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => {
                        setPrimaryColor(customColor);
                        setShowColorPicker(false);
                      }}
                    >
                      Apply
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Layout
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">Layout Style</FormLabel>
              <RadioGroup
                value={layout}
                onChange={(e) => setLayout(e.target.value)}
                row
              >
                <FormControlLabel 
                  value="default" 
                  control={<Radio />} 
                  label="Default" 
                />
                <FormControlLabel 
                  value="compact" 
                  control={<Radio />} 
                  label="Compact" 
                />
                <FormControlLabel 
                  value="spacious" 
                  control={<Radio />} 
                  label="Spacious" 
                />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Display</FormLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={dense}
                      onChange={(e) => setDense(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Dense spacing"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={rounded}
                      onChange={(e) => setRounded(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Rounded corners"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={shadows}
                      onChange={(e) => setShadows(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Shadows"
                />
              </Box>
            </FormControl>
          </Paper>

          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Preview
            </Typography>
            <Box 
              sx={{ 
                p: 3, 
                bgcolor: 'background.paper',
                borderRadius: rounded ? 1 : 0,
                boxShadow: shadows ? 1 : 'none',
                mb: 2
              }}
            >
              <Box 
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'primary.contrastText', 
                  p: 2, 
                  mb: 2,
                  borderRadius: rounded ? 0.5 : 0,
                }}
              >
                <Typography variant="subtitle2">Primary Color</Typography>
              </Box>
              <Box 
                sx={{ 
                  bgcolor: 'background.default', 
                  p: 2, 
                  mb: 2,
                  borderRadius: rounded ? 0.5 : 0,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2">Card content</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  size={dense ? 'small' : 'medium'}
                >
                  Primary
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  size={dense ? 'small' : 'medium'}
                >
                  Secondary
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ThemeSettings;
