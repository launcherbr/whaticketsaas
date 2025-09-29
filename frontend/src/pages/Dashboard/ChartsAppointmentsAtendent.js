import "./button.css";

import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Registrar componentes do Chart.js
import ChartDataLabels from "chartjs-plugin-datalabels";

import Typography from "@material-ui/core/Typography";
import { Button, Stack, TextField } from "@mui/material";

import { makeStyles } from "@material-ui/core/styles";
import { blue, grey } from "@material-ui/core/colors";

import brLocale from "date-fns/locale/pt-BR";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";

import api from "../../services/api";
import { format } from "date-fns";
import { toast } from "react-toastify";

import { getRandomRGBA } from "../../utils/colors";
import { getFirstDayOfMonth, getLastDayOfMonth } from "../../utils/dates";

ChartJS.register(ArcElement, Tooltip, Legend);

const DATA_COUNT = 5;
const NUMBER_CFG = { count: DATA_COUNT, min: 0, max: 100 };

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.padding,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(2),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  iframeDashboard: {
    width: "100%",
    height: "calc(100vh - 64px)",
    border: "none",
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  customFixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 120,
  },
  customFixedHeightPaperLg: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
  },
  card1: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: "palette",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card2: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: "palette",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card3: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card4: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card5: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card6: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card7: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card8: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  card9: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
    //backgroundColor: theme.palette.primary.main,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.boxticket.main
        : theme.palette.primary.main,
    color: "#eee",
  },
  fixedHeightPaper2: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "row",
  },
  fixedGridPaper3: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
  },
}));

const ChartsAppointmentsAtendent = () => {
  const classes = useStyles();

  const companyId = localStorage.getItem("companyId");

  // const classes = useStyles();
  const [finalDate, setFinalDate] = useState(getLastDayOfMonth(new Date()));
  const [initialDate, setInitialDate] = useState(
    getFirstDayOfMonth(new Date())
  );
  const [ticketsData, setTicketsData] = useState({
    appointmentsByAttendents: [],
    ticketsByQueues: [],
  });

  useEffect(() => {
    handleChangeReportData();
  }, []);

  async function handleChangeReportData() {
    try {
      const { data } = await api.get(
        `/reports/appointmentsAtendent?initialDate=${format(
          initialDate,
          "yyyy-MM-dd"
        )}&finalDate=${format(finalDate, "yyyy-MM-dd")}&companyId=${companyId}`
      );

      setTicketsData(data);
    } catch (err) {
      console.log(err);
      toast.error("Erro ao obter informações dos atendimentos");
    }
  }

  const data = {
    labels: ticketsData.appointmentsByAttendents
      ? ticketsData.appointmentsByAttendents.map((item) => item.user_name)
      : [],
    datasets: [
      {
        label: "Número de Atendimentos",
        data: ticketsData.appointmentsByAttendents
          ? ticketsData.appointmentsByAttendents.map(
              (item) => item.total_tickets
            )
          : 0,
        backgroundColor: ticketsData.appointmentsByAttendents
          ? ticketsData.appointmentsByAttendents.map((item) => getRandomRGBA())
          : [],
        // borderColor: ticketsData.appointmentsByAttendents
        //   ? ticketsData.appointmentsByAttendents.map((item) => getRandomRGBA())
        //   : [],
        borderWidth: 1,
      },
    ],
  };

  const dataTicketsByQueues = {
    labels: ticketsData.ticketsByQueues
      ? ticketsData.ticketsByQueues.map((item) => item.name)
      : [],
    datasets: [
      {
        label: "Número de Atendimentos",
        data: ticketsData.ticketsByQueues
          ? ticketsData.ticketsByQueues.map((item) => item.total_tickets)
          : 0,
        backgroundColor: ticketsData.ticketsByQueues
          ? ticketsData.ticketsByQueues.map((item) => getRandomRGBA())
          : [],
        // borderColor: ticketsData.ticketsByQueues
        //   ? ticketsData.ticketsByQueues.map((item) => getRandomRGBA())
        //   : [],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "left",
        labels: {
          font: { size: 16 },
          padding: 20,
          boxWidth: 20,
          boxHeight: 20,
        },
      },
      datalabels: {
        display: true,
        color: "#fff",
        textStrokeColor: "#000",
        textStrokeWidth: 2,
        font: {
          size: 20,
          weight: "bold",
        },
      },
    },
  };

  return (
    <Grid item xs={12}>
      <Paper className={classes.fixedHeightPaper2}>
        <Grid item xs={6} className={classes.fixedGridPaper3}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Atendimentos por Atendentes
          </Typography>
          <span style={{ fontSize: 13, color: "#bcbcbc" }}>
            Saiba quais são os atendentes mais produtivos
          </span>
          <Stack
            direction={"row"}
            spacing={2}
            alignItems={"center"}
            sx={{ my: 2 }}
          >
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={brLocale}
            >
              <DatePicker
                value={initialDate}
                onChange={(newValue) => {
                  setInitialDate(newValue);
                }}
                label="Inicio"
                renderInput={(params) => (
                  <TextField fullWidth {...params} sx={{ width: "20ch" }} />
                )}
              />
            </LocalizationProvider>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={brLocale}
            >
              <DatePicker
                value={finalDate}
                onChange={(newValue) => {
                  setFinalDate(newValue);
                }}
                label="Fim"
                renderInput={(params) => (
                  <TextField fullWidth {...params} sx={{ width: "20ch" }} />
                )}
              />
            </LocalizationProvider>

            <Button
              className="buttonHover"
              onClick={handleChangeReportData}
              variant="contained"
            >
              Filtrar
            </Button>
          </Stack>
          <Doughnut
            data={data}
            options={options}
            style={{ maxWidth: "100%", maxHeight: "250px" }}
          />
        </Grid>

        <Grid item xs={6} className={classes.fixedGridPaper3}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Atendimentos por Departamentos/Filas
          </Typography>

          <span style={{ fontSize: 13, color: "#bcbcbc" }}>
            Saiba quais são os departamentos mais procurados
          </span>
          <Stack
            direction={"row"}
            spacing={2}
            alignItems={"center"}
            sx={{ my: 2 }}
          >
            <div style={{ height: 60 }} />
          </Stack>
          <Doughnut
            data={dataTicketsByQueues}
            options={options}
            style={{ maxWidth: "100%", maxHeight: "250px" }}
          />
        </Grid>
      </Paper>
    </Grid>
  );
};

export default ChartsAppointmentsAtendent;
