/* eslint-disable no-console */
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useHistory, useLocation } from 'react-router-dom';
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
import PdfIcon from '@material-ui/icons/PictureAsPdf';
import { Pagination } from '@material-ui/lab';
import { pdf } from '@react-pdf/renderer';
import chillout from 'chillout';
import { saveAs } from 'file-saver';

import MainContainer from '../../../components/MainContainer';
import MainHeader from '../../../components/MainHeader';
import MainHeaderButtonsWrapper from '../../../components/MainHeaderButtonsWrapper';
import SelectLimitDropdown from '../../../components/SelectLimitDropdown';
import TableRowSkeleton from '../../../components/TableRowSkeleton';
import Title from '../../../components/Title';
import useAuth from '../../../context/Auth/useAuth';
import api from '../../../services/api';
import { i18n } from '../../../translate/i18n';
import zipFiles from '../../../utils/zipFiles';
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

const TicketsDurationDetailReports = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { company } = useAuth();

  const [contact, setContact] = useState({});

  const [tickets, setTickets] = useState([]);
  
  const [dateStartParam, setDateStartParam] = useState('');
  const [dateEndParam, setDateEndParam] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalData, setTotalData] = useState(0);

  const [pdfLoading, setPdfLoading] = useState(false);  

  const { isLoading } = useQuery(
    ['reports_duration_detail', dateStartParam, dateEndParam],
    async () => {

      const response = await api.get('reports/tickets/time/detail', {
        params: {
          company_id: company.id,
          contact_id: contact.id,
          dateStartParam,
          dateEndParam,
          page,
          perPage,
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        setHasMore(data.items.length > 0 ? Number(page) !== data.pages : false);
        setTotalData(data.count);
        setTotalPages(data.pages);
        setTickets(data.items);
      },
      enabled: !!company.id && !!contact.id,
      refetchInterval: 10000,
    }
  );

  const handlePages = (page) => {
    setPage(page);
  };

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
      if (totalData > 1000) {
        toast.info('Gerando relatório compactado, por favor aguarde.');
        const filesArray = [];
        const pdfPages = Math.ceil(totalData / 500);

        await chillout.repeat(pdfPages, async (i) => {
          const pdfPaginatedData = await queryClient.fetchQuery(
            'pdf_data',
            async () => {
              const response = await api.get('reports/tickets/time/detail', {
                params: {
                  company_id: company.id,
                  contact_id: contact.id,
                  dateStartParam,
                  dateEndParam,
                  page: i + 1,
                  perPage: 500,
                },
              });
              return response.data;
            },
            {
              staleTime: 10000,
            }
          );

          const pdfBlob = await pdf(
            <PDFFile
              tickets={pdfPaginatedData.items}
              name={contact.name}
            />
          ).toBlob();

          filesArray.push({
            file: pdfBlob,
            name: 'tickets_report_' + (i + 1) + '.pdf',
          });
        });

        if (filesArray.length === 1) {
          saveAs(filesArray[0].file, filesArray[0].name);
          setPdfLoading(false);
          return;
        }

        const zip = await zipFiles(filesArray);

        saveAs(zip, `topzap_atenditmentos_${formattedDate}_compact_report_${contact.name}.zip`);
        setPdfLoading(false);
        return;
      }

      const data = await queryClient.fetchQuery(
        'pdf_data',
        async () => {
          const response = await api.get('reports/tickets/time/detail', {
            params: {
              company_id: company.id,
              contact_id: contact.id,
              dateStartParam,
              dateEndParam,
              pdf: true,
            },
          });
          return response.data;
        },
        {
          staleTime: 10000,
        }
      );

      const blob = await pdf(
        <PDFFile tickets={data.pdfData} name={contact.name}/>
      ).toBlob();

      saveAs(blob, `topzap_atendimentos_${formattedDate}_report_${contact.name}.pdf`);

      setPdfLoading(false);
    } catch (error) {
      setPdfLoading(false);
      toast.error('Erro ao gerar o relatório');
      console.log(error);
    }
  }, [dateEndParam, dateStartParam, queryClient, totalData, company, contact]);

  const handleSearch = (event, type) => {
    if (type === 'start') setDateStartParam(event.target.value);
    else setDateEndParam(event.target.value);
  };

  useEffect(() => {
    if (location && location.state && location.state.state && location.state.state.id && location.state.state.name) {
      setContact({
        id: location.state.state.id,
        name: location.state.state.name,
      })

    if (location.state.state.dateStartParam) {
      setDateStartParam(location.state.state.dateStartParam);
    }

    if (location.state.state.dateEndParam) {
      setDateEndParam(location.state.state.dateEndParam);
    }
    }
  }, [location]);


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
        <Title>Relatório de Duração do Atendimento - { contact ? contact.name || '' : '' } </Title>

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
                <TableCell align="center"> Início do atendimento </TableCell>
                <TableCell align="center"> Última atualização </TableCell>
                <TableCell align="center"> Status </TableCell>
                <TableCell align="center"> Último atendente </TableCell>
                <TableCell align="center"> Duração após finalizado </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.length > 0 && tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell align="center">{ticket.dateInit}</TableCell>
                  <TableCell align="center">{ticket.dateEnd}</TableCell>
                  <TableCell align="center">{ticket.status}</TableCell>
                  <TableCell align="center">{ticket.attendant}</TableCell>
                  <TableCell align="center">{ticket.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Box
        sx={{
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Pagination
          page={page}
          count={totalPages}
          onChange={(e) => handlePages(e.target.textContent)}
          hideNextButton={hasMore}
          hidePrevButton={page === 1}
        />
        <SelectLimitDropdown
          setPage={setPage}
          setLimit={setPerPage}
          limit={perPage}
        />
      </Box>
    </MainContainer>
  );
};

export default TicketsDurationDetailReports;
