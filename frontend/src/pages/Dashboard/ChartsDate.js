import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import brLocale from 'date-fns/locale/pt-BR';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Button, Stack, TextField } from '@mui/material';
import Typography from "@material-ui/core/Typography";
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import './button.css';
import { getRandomRGBA } from '../../utils/colors';
import { getFirstDayOfMonth, getLastDayOfMonth } from '../../utils/dates';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
            display: false,
        },
        title: {
            display: true,
            text: 'Gráfico de Conversas',
            position: 'left',
        },
        datalabels: {
            display: true,
            anchor: 'start',
            offset: -30,
            align: "start",
            color: "#fff",
            textStrokeColor: "#000",
            textStrokeWidth: 2,
            font: {
                size: 20,
                weight: "bold"

            },
        }
    },
};

export const ChartsDate = () => {

    const [finalDate, setFinalDate] = useState(getLastDayOfMonth(new Date()));
    const [initialDate, setInitialDate] = useState(
        getFirstDayOfMonth(new Date())
    );
    const [ticketsData, setTicketsData] = useState({ data: [], count: 0 });

    const companyId = localStorage.getItem("companyId");

    useEffect(() => {
        handleGetTicketsInformation();
    }, []);

    const dataCharts = {
      labels:
        ticketsData &&
        ticketsData?.data.length > 0 &&
        ticketsData?.data.map((item) =>
          item.hasOwnProperty("horario")
            ? `Das ${item.horario}:00 as ${item.horario}:59`
            : item.data
        ),
      datasets: [
        {
          // label: 'Dataset 1',
          data:
            ticketsData?.data.length > 0 &&
            ticketsData?.data.map((item, index) => {
              return item.total;
            }),
          backgroundColor:
            ticketsData?.data.length > 0 &&
            ticketsData?.data.map((item, index) => {
              return getRandomRGBA();;
            }),
        },
      ],
    };


    const handleGetTicketsInformation = async () => {
        try {
            const { data } = await api.get(`/dashboard/ticketsDay?initialDate=${format(initialDate, 'yyyy-MM-dd')}&finalDate=${format(finalDate, 'yyyy-MM-dd')}&companyId=${companyId}`);
            setTicketsData(data);
        } catch (error) {
            toast.error('Erro ao buscar informações dos tickets');
        }
    }

    return (
        <>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Total ({ticketsData?.count})
            </Typography>

            <Stack direction={'row'} spacing={2} alignItems={'center'} sx={{ my: 2, }} >

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker
                        value={initialDate}
                        onChange={(newValue) => { setInitialDate(newValue) }}
                        label="Inicio"
                        renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}

                    />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker
                        value={finalDate}
                        onChange={(newValue) => { setFinalDate(newValue) }}
                        label="Fim"
                        renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}
                    />
                </LocalizationProvider>

                <Button className="buttonHover" onClick={handleGetTicketsInformation} variant='contained' >Filtrar</Button>

            </Stack>
            <Bar options={options} data={dataCharts} style={{ maxWidth: '100%', maxHeight: '280px', }} />
        </>
    );
}