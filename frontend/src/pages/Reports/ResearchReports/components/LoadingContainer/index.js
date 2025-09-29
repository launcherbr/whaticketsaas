import React from 'react';

import { Box } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';

export default function LoadingContainer() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: 'lightgray',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <CircularProgress size={120} />
    </Box>
  );
}
