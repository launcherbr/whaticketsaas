import "./button.css";

import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import Typography from "@material-ui/core/Typography";
import { Button, Stack, TextField } from "@mui/material";

import { makeStyles } from "@material-ui/core/styles";
import { blue, grey } from "@material-ui/core/colors";

import brLocale from "date-fns/locale/pt-BR";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";

import api from "../../services/api";

import { toast } from "react-toastify";
import { format } from "date-fns";

import { getRandomRGBA } from "../../utils/colors";
import { getFirstDayOfMonth, getLastDayOfMonth } from "../../utils/dates";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
    flexDirection: "column",
  },
}));

const ChartsRushHour = () => {
  const classes = useStyles();

  const companyId = localStorage.getItem("companyId");

  const [finalDate, setFinalDate] = useState(getLastDayOfMonth(new Date()));
  const [initialDate, setInitialDate] = useState(
    getFirstDayOfMonth(new Date())
  );
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    handleChangeReportData();
  }, []);

  async function handleChangeReportData() {
    try {
      const { data } = await api.get(
        `/reports/rushHour?initialDate=${format(
          initialDate,
          "yyyy-MM-dd"
        )}&finalDate=${format(finalDate, "yyyy-MM-dd")}&companyId=${companyId}`
      );

      setChartData(data);
    } catch (err) {
      console.log(err);
      toast.error("Erro ao obter informações dos atendimentos");
    }
  }

  const data = {
    labels:
      chartData.length > 0
        ? chartData.map((item) => `${item.message_hour}:00`)
        : 0,
    datasets: [
      {
        label: "Quantidade",
        data:
          chartData.length > 0
            ? chartData.map((item) => item.message_count)
            : 0,
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        fill: true,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Hora do Dia",
        },
      },
      y: {
        title: {
          display: true,
          text: "",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
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
    <Grid item xs={12} style={{ marginTop: 8, marginBottom: 8 }}>
      <Paper className={classes.fixedHeightPaper2}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          Horário de Pico - Troca de mensagens
        </Typography>
        <span style={{ fontSize: 13, color: "#bcbcbc" }}>
          Quantidade de mensagens recebidas e enviados em cada hora do dia.
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

        <Line data={data} options={options} height={100} />
      </Paper>
    </Grid>
  );
};

export default ChartsRushHour;
