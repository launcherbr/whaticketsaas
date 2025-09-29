/* eslint-disable react/display-name */
/* eslint-disable no-console */
import React from 'react';

import { Grid } from '@material-ui/core';

import MainHeader from '../../components/MainHeader';
import Title from '../../components/Title';
import MainContainer from './components/MainContainer';
import ReportsContainer from './components/ReportsContainer';
import reportsRoutes from './utils/ReportsRoutes';

const Reports = () => {
  return (
    <MainContainer>
      <MainHeader>
        <Title>Relatórios</Title>
      </MainHeader>
      <Grid container spacing={4} sx={{ overflowY: 'unset' }}>
        <Grid item xs={6}>
          <ReportsContainer
            title="Atendimentos"
            links={reportsRoutes.tickets}
          />
        </Grid>
        <Grid item xs={6}>
          <ReportsContainer title="Pesquisas" links={reportsRoutes.research} />
        </Grid>
        <Grid item xs={6}>
          <ReportsContainer title="Grupos" links={reportsRoutes.groups} />
        </Grid>
      </Grid>
    </MainContainer>
  );
};

export default Reports;
