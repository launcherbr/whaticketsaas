import React from "react";

import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";

const useStyles = makeStyles(theme => ({
	mainContainer: {
		flex: 1,
		padding: 0,
		height: `calc(100% - 48px)`,
		display: "flex",
		flexDirection: "column",
	},

	contentWrapper: {
		height: "100%",
		width: "100%",
		overflowY: "hidden",
		display: "flex",
		flexDirection: "column",
		flex: 1,
	},
}));

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<Container className={classes.mainContainer} maxWidth={false} disableGutters>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;
