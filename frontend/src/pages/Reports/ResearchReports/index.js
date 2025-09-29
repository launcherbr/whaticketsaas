/* eslint-disable no-console */
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Box } from '@material-ui/core';
import { IconButton } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { green, red } from '@material-ui/core/colors';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { ChevronLeft } from '@material-ui/icons';
import { CheckCircle, Cancel } from '@material-ui/icons';
import PdfIcon from '@material-ui/icons/PictureAsPdf';
import { Pagination } from '@material-ui/lab';
import { pdf } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';

import MainContainer from '../../../components/MainContainer';
import MainHeader from '../../../components/MainHeader';
// import MainHeaderButtonsWrapper from '../../../components/MainHeaderButtonsWrapper';
import Title from '../../../components/Title';
import api from '../../../services/api';
import formatHtmlToNormal from '../../../utils/formatHtmlToNormal';
import EmptyTable from './components/EmptyTable';
import LoadingContainer from './components/LoadingContainer';
import renderLabel from './components/RenderLabel';
import ResearchBox from './components/ResearchBox';
import ResearchReportPdf from './components/ResearchReportPdf';
import UsersDropdown from './components/UsersDropdown';
import { FiltersContainer } from './styles';

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

export default function Researchreports() {
  const classes = useStyles();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [dateIni, setDateIni] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [page, setPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [researchs, setResearchs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId),
    [users, selectedUserId]
  );

  const handleBack = () => {
    history.goBack();
  };

  const handleSearch = (event, type) => {
    if (type === 'start') setDateIni(event.target.value);
    else setDateFin(event.target.value);
  };

  const handlePages = (page) => {
    setPage(page);
  };

  const { data, isFetching } = useQuery(
    ['researchs_reports', page, dateIni, dateFin, selectedUserId],
    async () => {
      const response = await api.get('researchs/reports', {
        params: {
          page,
          perPage: 20,
          dateIni,
          dateFin,
          userId: selectedUserId,
        },
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        if (data.items.length > 0) {
          const formattedResponse = data.items.map((research) => {
            return {
              ...research,
              columns: [
                {
                  id: 'resposta',
                  label: renderLabel(research.pesquisa, research.ativa),
                  align: 'left',
                  minWidth: 200,
                },
                {
                  id: 'total',
                  label: 'Quantidade',
                  minWidth: 20,
                  align: 'center',
                },
                {
                  id: 'porcentagem',
                  label: '%',
                  minWidth: 20,
                  align: 'center',
                },
              ],
            };
          });

          setUsers(data.companyUsers);
          setTotalPages(data.pages);
          setResearchs(formattedResponse);
        } else {
          setResearchs([]);
          setTotalPages(0);
          setHasMore(false);
        }
      },
    }
  );

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
          const response = await api.get('researchs/reports', {
            params: {
              dateFin,
              dateIni,
              pdf: true,
            },
          });
          return response.data;
        },
        {
          staleTime: 10000,
        }
      );

      const formattedResponse = data.items.map((research) => {
        return {
          ...research,
          columns: [
            {
              id: 'resposta',
              label: `${
                research.ativa === 1 ? '(Ativa)' : '(Inativa)'
              } - ${formatHtmlToNormal(research.pesquisa)}`,
              align: 'left',
              width: '80%',
              fontStyle: research.ativa === 1 ? 'normal' : 'italic',
              active: research.ativa,
            },
            {
              id: 'total',
              label: 'Quantidade',
              width: '10%',
              align: 'center',
              fontStyle: 'normal',
            },
            {
              id: 'porcentagem',
              label: '%',
              width: '10%',
              align: 'center',
              question: false,
              fontStyle: 'normal',
            },
          ],
        };
      });

      const blob = await pdf(
        <ResearchReportPdf
          researchs={formattedResponse}
          user={selectedUser}
          dateIni={dateIni ? format(parseISO(dateIni), 'dd/MM/yyyy') : ''}
          dateFin={dateFin ? format(parseISO(dateFin), 'dd/MM/yyyy') : ''}
        />
      ).toBlob();

      if (selectedUser) {
        saveAs(
          blob,
          `topzap_pesquisas_${selectedUser.name}_${formattedDate}.pdf`
        );
      } else {
        saveAs(blob, `topzap_pesquisas_${formattedDate}_report.pdf`);
      }

      setPdfLoading(false);
    } catch (error) {
      setPdfLoading(false);
      toast.error('Erro ao gerar o relatório');
      console.log(error);
    }
  }, [dateFin, dateIni, queryClient, selectedUser]);

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
        <Title>Relatório de Pesquisas Realizadas</Title>

        <FiltersContainer>
          <UsersDropdown
            users={users}
            value={selectedUserId}
            setUser={setSelectedUserId}
          />
          <TextField
            onChange={(event) => handleSearch(event, 'start')}
            type="date"
            value={dateIni}
          />

          <TextField
            onChange={(event) => handleSearch(event, 'end')}
            type="date"
            value={dateFin}
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
                <div style={{ marginLeft: 6 }}>Exportar</div>
                <PdfIcon />
              </>
            )}
          </Button>
        </FiltersContainer>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        {!isFetching ? (
          data?.items?.length > 0 ? (
            <>
              {researchs.map((research, key) => (
                <ResearchBox key={key} research={research} />
              ))}
            </>
          ) : (
            <EmptyTable />
          )
        ) : (
          <LoadingContainer />
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            marginRight: '0.8rem',
          }}
        >
          <div>
            <CheckCircle style={{ color: green[500], marginBottom: '-6px' }} />
            <span style={{ marginLeft: 5, marginBottom: 5 }}>
              Pesquisa ativa
            </span>
          </div>

          <div style={{ marginLeft: 5 }}>
            <Cancel style={{ color: red[300], marginBottom: '-6px' }} />
            <span style={{ marginLeft: 5, marginBottom: 5 }}>
              Pesquisa inativa
            </span>
          </div>
        </Box>
      </Box>
    </MainContainer>
  );
}
