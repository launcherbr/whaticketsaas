import React from "react";
import { makeStyles } from "@material-ui/core";
import { green, red } from '@material-ui/core/colors';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';

const useStyles = makeStyles(theme => ({
    on: {
        color: green[600],
        fontSize: '20px'
    },
    off: {
        color: red[600],
        fontSize: '20px'
    }
}));

const UserStatusIcon = ({ user }) => {
    const classes = useStyles();
    return user.online ?
        <CheckCircleIcon className={classes.on} />
        : <ErrorIcon className={classes.off} />
}

export default UserStatusIcon;