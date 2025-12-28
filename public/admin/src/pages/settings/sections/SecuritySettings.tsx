import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  Grid,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Password as PasswordIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  DeviceHub as DeviceHubIcon
} from '@mui/icons-material';

const SecuritySettings: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: true,
    biometricAuth: false,
    autoLogout: true,
    autoLogoutTimeout: 30
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // Simulate API call
      console.log('Updating security settings:', formData);
      setSuccess('Security settings updated successfully');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <SecurityIcon sx={{ mr: 1 }} />
        Security Settings
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <LockIcon color="primary" sx={{ mr: 1 }} />
          Change Password
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword}
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                error={!!errors.newPassword}
                helperText={errors.newPassword || 'At least 8 characters'}
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PasswordIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PasswordIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  startIcon={<LockIcon />}
                >
                  Update Password
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, height: '100%' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  PASSWORD REQUIREMENTS
                </Typography>
                <Box component="ul" sx={{ pl: 2, '& li': { fontSize: '0.875rem', mb: 1 } }}>
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                  <li>Not similar to your previous passwords</li>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon color="primary" sx={{ mr: 1 }} />
          Authentication Methods
        </Typography>
        
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.twoFactorAuth}
                onChange={handleChange}
                name="twoFactorAuth"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography>Two-Factor Authentication</Typography>
                <Typography variant="body2" color="textSecondary">
                  Add an extra layer of security to your account
                </Typography>
              </Box>
            }
            sx={{ width: '100%', m: 0, py: 1.5, alignItems: 'flex-start' }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={formData.biometricAuth}
                onChange={handleChange}
                name="biometricAuth"
                color="primary"
              />
            }
            label={
              <Box>
                <Typography>Biometric Authentication</Typography>
                <Typography variant="body2" color="textSecondary">
                  Use fingerprint or face recognition to sign in
                </Typography>
              </Box>
            }
            sx={{ width: '100%', m: 0, py: 1.5, alignItems: 'flex-start' }}
          />
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DeviceHubIcon color="primary" sx={{ mr: 1 }} />
          Session Settings
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={formData.autoLogout}
              onChange={handleChange}
              name="autoLogout"
              color="primary"
            />
          }
          label="Auto Logout"
          sx={{ width: '100%', m: 0, py: 1.5 }}
        />
        
        <Box sx={{ ml: 4, mt: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Logout after
          </Typography>
          <TextField
            select
            size="small"
            value={formData.autoLogoutTimeout}
            onChange={handleChange}
            name="autoLogoutTimeout"
            disabled={!formData.autoLogout}
            variant="outlined"
            SelectProps={{ native: true }}
            sx={{ minWidth: 100, mr: 1 }}
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={0}>Never</option>
          </TextField>
          <Typography variant="body2" color="textSecondary">
            of inactivity
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SecuritySettings;
