import React from 'react';

import { Box, Typography } from '@material-ui/core';

import { StyledClearIcon } from './styles';

export default function EmptyTable() {
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
      <Typography variant="h3" component="div">
        Não há relatórios de pesquisa para serem exibidos no período
        selecionado.
      </Typography>
      <StyledClearIcon />
    </Box>
  );
}
