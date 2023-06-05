import React from 'react';
import { Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import FloatingCard from '../components/FloatingCard';

const ComingSoon = () => {
  const navigate = useNavigate();

  return <FloatingCard type="invisible" size="medium" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
    <Typography variant="h2" gutterBottom>
      Coming Soon!
    </Typography>
    <Typography variant="body1" gutterBottom>
      More stuff is in the works!
    </Typography>
    <Button variant="contained" color="primary" onClick={() => navigate('/')}>
      Return Home
    </Button>
  </FloatingCard>
};

export default ComingSoon;