import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../../theme';
import Button from '../Button';

describe('Button', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    );
  };

  it('renders with default props', () => {
    renderWithTheme(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('MuiButton-contained');
    expect(button).not.toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    renderWithTheme(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with start icon', () => {
    renderWithTheme(
      <Button startIcon={<span data-testid="start-icon">+</span>}>
        Add Item
      </Button>
    );
    
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('renders as disabled when loading', () => {
    renderWithTheme(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = renderWithTheme(
      <Button variant="outlined">Outlined</Button>
    );
    expect(screen.getByRole('button')).toHaveClass('MuiButton-outlined');

    rerender(
      <ThemeProvider theme={theme}>
        <Button variant="text">Text</Button>
      </ThemeProvider>
    );
    expect(screen.getByRole('button')).toHaveClass('MuiButton-text');
  });
});
