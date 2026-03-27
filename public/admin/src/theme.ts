// theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: "dark",

        background: {
            default: "#0b0f14",
            paper: "#11161c"
        },

        primary: {
            main: "#3b82f6"
        },

        divider: "#1f2933",

        text: {
            primary: "#e6edf3",
            secondary: "#9aa4af"
        }
    },

    typography: {
        fontFamily: [
            'Inter',
            'Roboto',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Arial',
            'sans-serif',
        ].join(','),

        h1: { fontSize: '2.5rem', fontWeight: 500 },
        h2: { fontSize: '2rem', fontWeight: 500 },
        h3: { fontSize: '1.75rem', fontWeight: 500 },
        h4: { fontSize: '1.5rem', fontWeight: 500 },
        h5: { fontSize: '1.25rem', fontWeight: 500 },
        h6: { fontSize: '1rem', fontWeight: 500 },

        allVariants: {
            color: "#e6edf3"
        }
    },

    components: {

        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: "#0b0f14",
                    color: "#e6edf3"
                }
            }
        },

        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8
                }
            }
        },

        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: "#11161c",
                    border: "1px solid #1f2933"
                }
            }
        },

        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    backgroundColor: "#11161c",
                    border: "1px solid #1f2933",
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    '&:hover': {
                        boxShadow: '0 14px 28px rgba(0,0,0,0.12), 0 10px 10px rgba(0,0,0,0.08)',
                    },
                },
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    color: "#e6edf3",
                    '& fieldset': {
                        borderColor: "#1f2933"
                    },
                    '&:hover fieldset': {
                        borderColor: "#3b82f6"
                    }
                }
            }
        }
    }
});

export default theme;