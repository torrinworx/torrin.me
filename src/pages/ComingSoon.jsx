import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import FloatingCard from '../components/FloatingCard';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <Box textAlign="center" py={5} zIndex={1}>
      <FloatingCard type="invisible" size="small" />
      <Typography variant="h2" gutterBottom>
        Coming Soon!
      </Typography>
      <Typography variant="body1" gutterBottom>
        More stuff is in the works!
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate('/')}>
        Return Home
      </Button>
      <FloatingCard type="invisible" size="small" />
    </Box>
  );
};

export default ComingSoon;