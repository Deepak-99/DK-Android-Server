import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <Box sx={{ display: 'flex' }}>
            <Navbar />
            <Sidebar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    mt: 8, // Adjust based on your navbar height
                    minHeight: '100vh',
                    backgroundColor: 'background.default'
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;