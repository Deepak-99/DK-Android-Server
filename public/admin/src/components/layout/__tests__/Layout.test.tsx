import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../theme';
import Layout from '../Layout';

describe('Layout', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  it('renders the layout with header, sidebar, and main content', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="main-content">Test Content</div>
      </Layout>
    );

    // Check if header is rendered
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Check if sidebar is rendered
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check if main content is rendered
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders the app title', () => {
    renderWithProviders(
      <Layout>
        <div>Test</div>
      </Layout>
    );
    
    expect(screen.getByText(/DK-Hawkshaw/i)).toBeInTheDocument();
  });
});
