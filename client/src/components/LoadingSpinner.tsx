import React from 'react';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Fade,
  Backdrop
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
  thickness?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message = 'Loading...',
  fullScreen = false,
  color = 'primary',
  thickness = 3.6
}) => {
  const spinnerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3
      }}
    >
      <CircularProgress 
        size={size} 
        color={color}
        thickness={thickness}
      />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            textAlign: 'center',
            maxWidth: 300
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}
        open={true}
      >
        <Fade in={true}>
          {spinnerContent}
        </Fade>
      </Backdrop>
    );
  }

  return (
    <Fade in={true}>
      {spinnerContent}
    </Fade>
  );
};

// Centered loading spinner for pages
export const PageLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%'
    }}
  >
    <LoadingSpinner size={60} message={message} />
  </Box>
);

// Inline loading spinner for components
export const InlineLoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}
  >
    <LoadingSpinner size={24} message={message} />
  </Box>
);

// Button loading spinner
export const ButtonLoadingSpinner: React.FC = () => (
  <CircularProgress 
    size={20} 
    color="inherit" 
    thickness={4}
  />
);