/* eslint-disable no-console */
import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';


import { Box } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TextField from '@material-ui/core/TextField';
import { ChevronLeft } from '@material-ui/icons'; 
import InfoIcon from '@material-ui/icons/Info';
import PdfIcon from '@material-ui/icons/PictureAsPdf';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

import MainContainer from '../../../components/MainContainer';
import MainHeader from '../../../components/MainHeader';
import MainHeaderButtonsWrapper from '../../../components/MainHeaderButtonsWrapper';
import TableRowSkeleton from '../../../components/TableRowSkeleton';
import Title from '../../../components/Title';
import useAuth from '../../../context/Auth/useAuth';
import api from '../../../services/api';
import { i18n } from '../../../translate/i18n';
import PDFFile from './utils/PDFFile';

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    overflowY: 'scroll',
    padding: theme.spacing(1),
    ...theme.scrollbarStyles,
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0',
    minHeight: '48px',
  },
}));

const TicketsDurationReports = () => {
  const classes = useStyles();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { company } = useAuth();
  const [tickets, setTickets] = useState([]);

  const [dateStartParam, setDateStartParam] = useState('');
  const [dateEndParam, setDateEndParam] = useState('');

  const [pdfLoading, setPdfLoading] = useState(false);  

  const { isLoading } = useQuery(
    ['reports_duration', dateStartParam, dateEndParam],
    async () => {

      const response = await api.get('reports/tickets/time', {
        params: {
          company_id: company.id,
          dateStartParam,
          dateEndParam,
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setTickets(data);
      },
      enabled: !!company.id,
      refetchInterval: 10000,
    }
  );

  const handleBack = () => {
    history.goBack();
  };

  const handlePdfData = useCallback(async () => {
    try {
      setPdfLoading(true);
      const newDate = new Date().toLocaleDateString('pt-BR');
      const newDateTime = new Date().toLocaleTimeString('pt-BR');
      const date = `${newDate}${newDateTime}`;
      const formattedDate = date.replace(/[\W_]+/g, '');

      const data = await queryClient.fetchQuery(
        'pdf_data',
        async () => {
          const response = await api.get('reports/tickets/time', {
            params: {
              company_id: company.id,
              dateStartParam,
              dateEndParam,
            },
          });
          return response.data;
        },
        {
          staleTime: 10000,
        }
      );

      const blob = await pdf(
        <PDFFile tickets={data} />
      ).toBlob();
      saveAs(blob, `topzap_atendimentos_${formattedDate}_report.pdf`);

      setPdfLoading(false);
    } catch (error) {
      setPdfLoading(false);
      toast.error('Erro ao gerar o relatório');
      console.log(error);
    }
  }, [company,dateStartParam,dateEndParam,queryClient]);

  const handleSearch = (event, type) => {
    if (type === 'start') setDateStartParam(event.target.value);
    else setDateEndParam(event.target.value);
  };

  function handleDetailTicket(id, name) {
    history.push('/reports/tickets/duration/detail', { state: { id, name, dateStartParam, dateEndParam }});
  }

  return (
    <MainContainer className={classes.mainContainer}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '50px',
        }}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={handleBack}>
            <ChevronLeft />
            <span style={{ fontSize: '1rem' }}>Voltar</span>
          </IconButton>
        </div>
      </Box>
      <MainHeader>
        <Title>Relatório de Duração dos Atendimentos</Title>

        <MainHeaderButtonsWrapper>
          <TextField
            onChange={(event) => handleSearch(event, 'start')}
            type="date"
            value={dateStartParam}
          />

          <TextField
            onChange={(event) => handleSearch(event, 'end')}
            type="date"
            value={dateEndParam}
          />
          <Button
            disabled={pdfLoading}
            onClick={handlePdfData}
            color="primary"
            variant="contained"
          >
            {pdfLoading ? (
              <div style={{ width: 100 }}>Carregando...</div>
            ) : (
              <>
                <div style={{ marginLeft: 6 }}>{i18n.t('Exportar')}</div>
                <PdfIcon />
              </>
            )}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        {isLoading === true && <TableRowSkeleton />}

        {isLoading === false && (
          <Table
            size="medium"
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center"> Contato </TableCell>
                <TableCell align="center"> Abertos </TableCell>
                <TableCell align="center"> Pendentes </TableCell>
                <TableCell align="center"> Finalizados </TableCell>
                <TableCell align="center"> Duração dos finalizados</TableCell>
                <TableCell align="center"> Ações </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length > 0 && tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell align="center">{ticket.name}</TableCell>
                  <TableCell align="center">{ticket.init}</TableCell>
                  <TableCell align="center">{ticket.pending}</TableCell>
                  <TableCell align="center">{ticket.finished}</TableCell>
                  <TableCell align="center">{ticket.result}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleDetailTicket(ticket.id, ticket.name)}
                      size="small"
                    >
                      <InfoIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </MainContainer>
  );
};

export default TicketsDurationReports;
