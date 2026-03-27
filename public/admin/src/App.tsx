// App.tsx
import { lazy, Suspense, ReactNode, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Button, Typography } from "@mui/material";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "sonner";

import ErrorBoundary from "./components/common/ErrorBoundary";
import Layout from "./components/layout/Layout";
import theme from "./theme";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { connect, disconnect } from "./services/websocket";
import AlertsListener from "./components/alerts/AlertsListener";

/* --------------------
   Lazy pages
-------------------- */

const Login = SuspenseWrapper(() => import("../src/pages/auth/Login"));
const Dashboard = SuspenseWrapper(() => import("./pages/dashboard"));
const Devices = SuspenseWrapper(() => import("./pages/devices/DevicesPage"));
const DeviceDetails = SuspenseWrapper(() => import("./pages/devices/[id]"));

const CallLogs = SuspenseWrapper(
  () => import("./pages/devices/[id]/features/CallLogs")
);

const CallRecordings = SuspenseWrapper(
  () => import("./pages/devices/[id]/features/CallRecordings")
);

const Commands = SuspenseWrapper(
  () => import("./pages/devices/[id]/features/Commands")
);

/* --------------------
   React Query
-------------------- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

/* --------------------
   Protected Route
-------------------- */

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

/* --------------------
   WebSocket Manager
-------------------- */

function WebSocketManager() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    connect();

    return () => disconnect();
  }, [isAuthenticated]);

  return null;
}

/* --------------------
   App
-------------------- */

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
          <Toaster position="top-right" richColors closeButton />

          <BrowserRouter>
            <AuthProvider>

              {/* ✅ WebSocket connects AFTER auth */}
              <WebSocketManager />

              <AlertsListener />

              <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />

                {/* Protected */}
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
                    <Route
                      index
                      element={<Navigate to="call-logs" replace />}
                    />
                    <Route path="call-logs" element={<CallLogs />} />
                    <Route
                      path="call-recordings"
                      element={<CallRecordings />}
                    />
                    <Route path="commands" element={<Commands />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>

          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

/* --------------------
   Lazy helper
-------------------- */

function SuspenseWrapper(
  importer: () => Promise<{ default: React.ComponentType<any> }>
) {
  const LazyComponent = lazy(importer);

  return (props: any) => (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}