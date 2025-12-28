import React from 'react';
import { Box, Typography, Link, Divider, Paper, Grid } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import BugReportIcon from '@mui/icons-material/BugReport';
import GitHubIcon from '@mui/icons-material/GitHub';
import InfoIcon from '@mui/icons-material/Info';
import { version } from '../../../../package.json';

const AboutSection: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h5" gutterBottom display="flex" alignItems="center">
          <InfoIcon color="primary" sx={{ mr: 1 }} />
          About DK-Hawkshaw
        </Typography>
        <Typography variant="body1" paragraph>
          DK-Hawkshaw is a powerful device management and monitoring platform designed to help you 
          keep track of and manage your devices efficiently.
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2, my: 2, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Version</Typography>
              <Typography variant="body1">{version}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">License</Typography>
              <Typography variant="body1">MIT</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Repository</Typography>
              <Link 
                href="https://github.com/yourusername/dk-hawkshaw" 
                target="_blank" 
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
                sx={{ textDecoration: 'none' }}
              >
                <GitHubIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                GitHub
              </Link>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Release Notes</Typography>
              <Link href="#" color="primary">View changelog</Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>Development</Typography>
        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
          <Link
            href="#"
            variant="button"
            color="primary"
            display="flex"
            alignItems="center"
            sx={{ textDecoration: 'none' }}
          >
            <CodeIcon sx={{ mr: 0.5 }} />
            View Source
          </Link>
          <Link
            href="#"
            variant="button"
            color="error"
            display="flex"
            alignItems="center"
            sx={{ textDecoration: 'none' }}
          >
            <BugReportIcon sx={{ mr: 0.5 }} />
            Report an Issue
          </Link>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Box>
        <Typography variant="body2" color="text.secondary" align="center">
          © {currentYear} DK-Hawkshaw. All rights reserved.
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" align="center">
          Made with ❤️ by the DK-Hawkshaw Team
        </Typography>
      </Box>
    </Box>
  );
};

export default AboutSection;
