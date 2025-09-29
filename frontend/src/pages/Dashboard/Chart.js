import React, { useState, useEffect } from "react";
import { useTheme } from "@material-ui/core/styles";
import {
	CartesianGrid,
	XAxis,
	YAxis,
	Label,
	ResponsiveContainer,
	LineChart,
	Line,
	Tooltip,
	Legend,
} from "recharts";
import { startOfHour, parseISO, format } from "date-fns";

import Title from "./Title";
import useTickets from "../../hooks/useTickets";

const Chart = ({ queueTicket }) => {
	const theme = useTheme();

	const { tickets, count } = useTickets({
		queueIds: queueTicket ? `[${queueTicket}]` : "[]",
	});

	const [chartData, setChartData] = useState([
		{ time: "00:00", amount: 0 },
		{ time: "01:00", amount: 0 },
		{ time: "02:00", amount: 0 },
		{ time: "03:00", amount: 0 },
		{ time: "04:00", amount: 0 },
		{ time: "05:00", amount: 0 },
		{ time: "06:00", amount: 0 },
		{ time: "07:00", amount: 0 },
		{ time: "08:00", amount: 0 },
		{ time: "09:00", amount: 0 },
		{ time: "10:00", amount: 0 },
		{ time: "11:00", amount: 0 },
		{ time: "12:00", amount: 0 },
		{ time: "13:00", amount: 0 },
		{ time: "14:00", amount: 0 },
		{ time: "15:00", amount: 0 },
		{ time: "16:00", amount: 0 },
		{ time: "17:00", amount: 0 },
		{ time: "18:00", amount: 0 },
		{ time: "19:00", amount: 0 },
		{ time: "20:00", amount: 0 },
		{ time: "21:00", amount: 0 },
		{ time: "22:00", amount: 0 },
		{ time: "23:00", amount: 0 },
	]);

	useEffect(() => {
		setChartData((prevState) => {
			let aux = [...prevState];

			aux.forEach((a) => {
				tickets.forEach((ticket) => {
					format(startOfHour(parseISO(ticket.createdAt)), "HH:mm") ===
						a.time && a.amount++;
				});
			});

			return aux;
		});
	}, [tickets]);

	return (
		<React.Fragment>
			<Title>{`${"Atendimentos Criados: "}${count}`}</Title>
			<ResponsiveContainer>
				<LineChart
					data={chartData}
					width={730}
					height={250}
					margin={{
						top: 5,
						right: 30,
						left: 20,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						dataKey="time"
						stroke={theme.palette.text.secondary}
					/>
					<YAxis
						type="number"
						allowDecimals={false}
						stroke={theme.palette.text.secondary}
					>
						<Tooltip />
						<Legend />
						<Label
							angle={270}
							position="left"
							style={{
								textAnchor: "middle",
								fill: theme.palette.text.primary,
							}}
						>
							Tickets
						</Label>
					</YAxis>
					<Line
						type="monotone"
						dataKey="amount"
						stroke="#8884d8"
						strokeWidth={2}
					// fill={theme.palette.primary.main}
					/>
				</LineChart>
			</ResponsiveContainer>
		</React.Fragment>
	);
};

export default Chart;
