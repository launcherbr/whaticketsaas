import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import { makeStyles, useTheme } from "@material-ui/core/styles"; // Importando useTheme

import TicketsManager from "../../components/TicketsManager/";
import Ticket from "../../components/Ticket/";


import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	chatContainer: {
		flex: 1,
		// backgroundColor: "#eee",
		padding: theme.spacing(0),
		height: `calc(100% - 48px)`,
		overflowY: "hidden",
	},

	chatPapper: {
		// backgroundColor: "red",
		display: "flex",
		height: "100%",
	},

	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
	},
	messagessWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
	},
	welcomeMsg: {
		backgroundColor: theme.palette.boxticket, 
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
	},
}));

const Chat = () => {
	const classes = useStyles();
	const { ticketId } = useParams();

    // Definindo os logos para modo claro e escuro
    const logoLight = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`;
    const logoDark = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/logo_w.png`;

    // Definindo o logo inicial com base no modo de tema atual
    const initialLogo = theme.palette.type === 'light' ? logoLight : logoDark;
    const [logoImg, setLogoImg] = useState(initialLogo);


	return (
		<div className={classes.chatContainer}>
			<div className={classes.chatPapper}>
				<Grid container spacing={0}>
					<Grid item xs={4} className={classes.contactsWrapper}>
						<TicketsManager />
					</Grid>
					<Grid item xs={8} className={classes.messagessWrapper}>
						{ticketId ? (
							<>
								<Ticket />
							</>
						) : (
							<Paper square variant="outlined" className={classes.welcomeMsg}>
							
							<div>
							 <center><img style={{ margin: "0 auto", width: "80%" }} src={`${logoImg}?r=${Math.random()}`} alt={`${process.env.REACT_APP_NAME_SYSTEM}`} /></center>
							</div>
							
							{/*<span>{i18n.t("chat.noTicketMessage")}</span>*/}
							</Paper>
						)}
					</Grid>
				</Grid>
			</div>
		</div>
	);
};

export default Chat;
