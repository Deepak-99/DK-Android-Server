// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRoutes from './routes';
import theme from './theme';
import Layout from './components/layout/Layout';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/auth/Login'));
const Dashboard = React.lazy(() => import('./pages/dashboard'));
const Devices = React.lazy(() => import('./pages/devices'));
const DeviceDetails = React.lazy(() => import('./pages/devices/[id]'));

// Feature pages
const CallLogs = React.lazy(() => import('./pages/devices/[id]/features/CallLogs'));
const CallRecordings = React.lazy(() => import('./pages/devices/[id]/features/CallRecordings'));
const Commands = React.lazy(() => import('./pages/devices/[id]/features/Commands'));
// Import other feature components...

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
  return (
    <ErrorBoundary
      fallback={
        <Box p={3}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </Button>
        </Box>
      }
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Suspense fallback={<div>Loading...</div>}>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Dashboard />} />
                                <Route path="devices" element={<Devices />} />
                                <Route path="devices/:id" element={<DeviceDetails />}>
                                    <Route index element={<Navigate to="overview" replace />} />
                                    <Route path="overview" element={<DeviceOverview />} />
                                    <Route path="call-logs" element={<CallLogs />} />
                                    <Route path="call-recordings" element={<CallRecordings />} />
                                    <Route path="commands" element={<Commands />} />
                                    {/* Add other feature routes */}
                                </Route>
                            </Route>
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>

                <Router>
                    <AppRoutes />
                </Router>
                {process.env.NODE_ENV === 'development' && (
                    <ReactQueryDevtools initialIsOpen={false} />
                )}
            </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;