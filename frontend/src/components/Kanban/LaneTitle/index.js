import React from 'react';
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    kanbanSquare: {
        width: "1.2rem",
        height: "1.2rem",
        borderRadius: "5px"
    },
    container: {
        display: "flex",
        gap: "5px",
        alignItems: "center"
    },
    quantity: {
        fontSize: ".75rem",
        fontWeight: "normal",
        color: "#000000DE",
        backgroundColor: "#d9d9d9",
        padding: "0 8px",
        borderRadius: "5px"
    }
}));

const LaneTitle = ({squareColor, firstLane, children, quantity}) => {
    const classes = useStyles();

    return (
        <div className={classes.container}>
            {!firstLane ? <div className={classes.kanbanSquare} style={{backgroundColor: squareColor}}></div> : <div style={{height: "1.2rem"}}></div>}
            {children}
            <div className={classes.quantity}>{quantity}</div>
        </div>
    )
}

export default LaneTitle;