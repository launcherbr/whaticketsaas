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
import PdfIcon from '@material-ui/icons/PictureAsPdf';
import { Pagination } from '@material-ui/lab';
import { pdf } from '@react-pdf/renderer';
import chillout from 'chillout';
import { format, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';

import MainContainer from '../../../components/MainContainer';
import MainHeader from '../../../components/MainHeader';
import MainHeaderButtonsWrapper from '../../../components/MainHeaderButtonsWrapper';
import SelectLimitDropdown from '../../../components/SelectLimitDropdown';
import TableRowSkeleton from '../../../components/TableRowSkeleton';
import Title from '../../../components/Title';
import { groupTicketsReports } from '../../../services/GroupTickets';
import { i18n } from '../../../translate/i18n';
import zipFiles from '../../../utils/zipFiles';
import GroupTicketExportReport from './components/GroupTicketExportReport';

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

const GroupTicketsReports = () => {
  const classes = useStyles();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [tickets, setTickets] = useState([]);

  const [dateStartParam, setDateStartParam] = useState('');
  const [dateEndParam, setDateEndParam] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalData, setTotalData] = useState(0);

  const [pdfLoading, setPdfLoading] = useState(false);

  const { isLoading } = useQuery(
    ['group_tickets_reports', page, dateStartParam, dateEndParam, limit],
    async () =>
      groupTicketsReports({ page, dateStartParam, dateEndParam, limit }),
    {
      onSuccess: (data) => {
        setHasMore(data.items.length > 0 ? Number(page) !== data.pages : false);
        setTotalData(data.count);
        setTotalPages(data.pages);
        setTickets(data.items);
      },
    }
  );

  const handlePages = (page) => {
    setPage(page);
  };

  const formateDate = (date) => {
    const parseDate = parseISO(date);
    const data = format(parseDate, " dd'/'MM'/'yyyy '-' HH:mm'h'", {
      timeZone: 'America/Sao_Paulo',
    });
    return data;
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
      // console.log(date);
      // console.log(totalData);
      if (totalData > 1000) {
        toast.info('Gerando relatório compactado, por favor aguarde.');
        const filesArray = [];
        const pdfPages = Math.ceil(totalData / 500);

        await chillout.repeat(pdfPages, async (i) => {
          const pdfPaginatedData = await queryClient.fetchQuery(
            'group_pdf_data',
            async () =>
              groupTicketsReports({
                dateStartParam,
                dateEndParam,
                page: i + 1,
                limit: 500,
              }),
            {
              staleTime: 10000,
            }
          );

          const pdfBlob = await pdf(
            <GroupTicketExportReport
              tickets={pdfPaginatedData.items}
              formatDate={formateDate}
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

        saveAs(
          zip,
          `topzap_atenditmentos_grupos_${formattedDate}_compact_report.zip`
        );
        setPdfLoading(false);
        return;
      }

      const data = await queryClient.fetchQuery(
        'group_pdf_data',
        async () =>
          groupTicketsReports({
            dateStartParam,
            dateEndParam,
            pdf: true,
          }),
        {
          staleTime: 10000,
        }
      );

      const blob = await pdf(
        <GroupTicketExportReport
          tickets={data.pdfData}
          formatDate={formateDate}
          groupTicket
        />
      ).toBlob();
      saveAs(blob, `topzap_atendimentos_grupo_${formattedDate}_report.pdf`);

      setPdfLoading(false);
    } catch (error) {
      setPdfLoading(false);
      toast.error('Erro ao gerar o relatório');
      console.log(error);
    }
  }, [dateEndParam, dateStartParam, queryClient, totalData]);

  const handleSearch = (event, type) => {
    if (type === 'start') setDateStartParam(event.target.value);
    else setDateEndParam(event.target.value);
  };

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
        <Title>Relatório de Atendimento em Grupos</Title>

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
                <TableCell align="center"> Ticket </TableCell>
                <TableCell align="center"> Contato </TableCell>
                <TableCell align="center"> WhatsApp </TableCell>
                <TableCell align="center"> Data Abertura </TableCell>
                <TableCell align="center"> Data Última Atualização </TableCell>
                <TableCell align="center"> Quem atendeu </TableCell>
                <TableCell align="center"> Status </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell align="center">{ticket.id}</TableCell>
                  <TableCell align="center">{ticket.contact.name}</TableCell>
                  <TableCell align="center">{ticket.contact.number}</TableCell>
                  <TableCell align="center">
                    {formateDate(ticket.createdAt)}
                  </TableCell>
                  <TableCell align="center">
                    {formateDate(ticket.updatedAt)}
                  </TableCell>
                  <TableCell align="center">
                    {ticket.attendant_user
                      ? ticket.attendant_user.name
                      : 'Aguardando atendimento'}
                  </TableCell>
                  <TableCell align="center">{ticket.status.name}</TableCell>
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
          setLimit={setLimit}
          limit={limit}
        />
      </Box>
    </MainContainer>
  );
};

export default GroupTicketsReports;
