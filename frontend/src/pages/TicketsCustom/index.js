import React, { useState } from "react";  // Import useState
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles, useTheme } from "@material-ui/core/styles"; // Importando useTheme

import TicketsManager from "../../components/TicketsManagerTabs/";
import Ticket from "../../components/Ticket/";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	chatContainer: {
		flex: 1,
		padding: 0,
		height: `calc(100vh - 56px)`,
		minHeight: `calc(100vh - 56px)`,
		maxHeight: `calc(100vh - 56px)`,
		overflowY: "hidden",
		display: "flex",
		flexDirection: "column",
	},

	contactsWrapper: {
		display: "flex",
		flex: 1,
		minHeight: 0,
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
	},
	messagesWrapper: {
		display: "flex",
		flex: 1,
		minHeight: 0,
		height: "100%",
		flexDirection: "column",
	},
	welcomeMsg: {
		backgroundColor: theme.palette.boxticket,
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		flex: 1,
		minHeight: 0,
		height: "100%",
		textAlign: "center",
	},
}));

const TicketsCustom = () => {
	// Initialize useTheme and useState inside the component
	const theme = useTheme();
	const [logoImg, setLogoImg] = useState(
		theme.palette.type === "light"
			? `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`
			: `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/logo_w.png`
	);

	const classes = useStyles();
	const { ticketId } = useParams();

	return (
		<div className={classes.chatContainer}>
			<Grid container spacing={0} style={{ flex: 1, minHeight: 0, height: "100%" }}>
				<Grid item xs={4} className={classes.contactsWrapper}>
					<TicketsManager />
				</Grid>
				<Grid item xs={8} className={classes.messagesWrapper}>
					{ticketId ? (
						<Ticket />
					) : (
						<Paper square variant="outlined" className={classes.welcomeMsg}>
							<div>
								<center>
									<img
										style={{ margin: "0 auto", width: "80%" }}
										src={`${logoImg}?r=${Math.random()}`}
										alt={`${process.env.REACT_APP_NAME_SYSTEM}`}
									/>
								</center>
							</div>
						</Paper>
					)}
				</Grid>
			</Grid>
		</div>
	);
};

export default TicketsCustom;
