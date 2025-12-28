import { Box, Grid, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../../services/dashboard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import StatCard from '../../components/dashboard/StatCard';
import RecentDevices from '../../components/dashboard/RecentDevices';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';

const Dashboard = () => {
    const { data: stats, isLoading, isError } = useQuery(
        ['dashboard', 'stats'],
        getDashboardStats,
        {
            refetchInterval: 30000, // Refresh every 30 seconds
        }
    );

    if (isLoading) {
        return (
            <Box>
                <LoadingSkeleton type="text" width="30%" height={48} />
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    {[1, 2, 3, 4].map((item) => (
                        <Grid item xs={12} sm={6} md={3} key={item}>
                            <LoadingSkeleton type="card" height={120} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (isError || !stats) {
        return (
            <Box textAlign="center" py={4}>
                <Typography color="error" gutterBottom>
                    Failed to load dashboard data
                </Typography>
            </Box>