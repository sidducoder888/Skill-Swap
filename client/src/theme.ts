import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Define the color palette
const palette = {
  primary: {
    main: '#007BFF', // A vibrant blue
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#6C757D', // A cool gray
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8F9FA', // A light gray background
    paper: '#FFFFFF', // White for paper elements
  },
  text: {
    primary: '#212529', // Dark gray for primary text
    secondary: '#6C757D', // Lighter gray for secondary text
  },
  error: {
    main: '#DC3545', // A standard red for errors
  },
  success: {
    main: '#28A745', // A standard green for success
  },
  warning: {
    main: '#FFC107', // A standard yellow for warnings
  },
};

// Create the base theme
let theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: palette.text.primary,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: palette.text.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: palette.text.primary,
    },
    body1: {
      fontSize: '1rem',
      color: palette.text.secondary,
    },
    body2: {
      fontSize: '0.875rem',
      color: palette.text.secondary,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0056b3',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #E0E0E0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          color: palette.text.primary,
        },
      },
    },
  },
});

// Make typography responsive
theme = responsiveFontSizes(theme);

export default theme;