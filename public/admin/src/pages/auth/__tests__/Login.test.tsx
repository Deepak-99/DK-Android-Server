import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../contexts/AuthContext';
import theme from '../../../../theme';
import Login from '../Login';

// Mock the auth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    error: null,
    loading: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <AuthProvider>
            {ui}
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Login Page', () => {
  it('renders login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    const mockLogin = jest.fn();
    
    // Mock the login function
    jest.spyOn(require('../../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      isAuthenticated: false,
      error: null,
      loading: false,
    }));
    
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('shows loading state', () => {
    jest.spyOn(require('../../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      login: jest.fn(),
      isAuthenticated: false,
      error: null,
      loading: true,
    }));
    
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    
    jest.spyOn(require('../../../hooks/useAuth'), 'useAuth').mockImplementation(() => ({
      login: jest.fn(),
      isAuthenticated: false,
      error: new Error(errorMessage),
      loading: false,
    }));
    
    renderWithProviders(<Login />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
