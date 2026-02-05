import React from "react";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    statusDot: {
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        display: 'inline-block',
        position: 'relative',
    },
    online: {
        backgroundColor: '#00ff00',
        boxShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
        animation: '$pulseGreen 1.5s ease-in-out infinite',
    },
    offline: {
        backgroundColor: '#ff0000',
        boxShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
        animation: '$pulseRed 1.5s ease-in-out infinite',
    },
    '@keyframes pulseGreen': {
        '0%': {
            boxShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
            opacity: 1,
        },
        '50%': {
            boxShadow: '0 0 20px #00ff00, 0 0 30px #00ff00, 0 0 40px #00ff00, 0 0 50px #00ff00',
            opacity: 0.8,
        },
        '100%': {
            boxShadow: '0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 30px #00ff00',
            opacity: 1,
        },
    },
    '@keyframes pulseRed': {
        '0%': {
            boxShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
            opacity: 1,
        },
        '50%': {
            boxShadow: '0 0 20px #ff0000, 0 0 30px #ff0000, 0 0 40px #ff0000, 0 0 50px #ff0000',
            opacity: 0.8,
        },
        '100%': {
            boxShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, 0 0 30px #ff0000',
            opacity: 1,
        },
    },
}));

const UserStatusIcon = ({ user }) => {
    const classes = useStyles();
    return (
        <span 
            className={`${classes.statusDot} ${user.online ? classes.online : classes.offline}`}
            title={user.online ? "Online" : "Offline"}
        />
    );
}

export default UserStatusIcon;