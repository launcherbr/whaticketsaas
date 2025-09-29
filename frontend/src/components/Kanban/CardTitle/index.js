import { Avatar, makeStyles } from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles(theme => ({
    container: {
        position: "relative",
        display: "flex",
        gap: "8px",
        alignItems: "center", 
        width: "100%"
    },
    titleAndSubtitleContainer: {
        maxWidth: "150px",
        display: "flex",
        flexShrink: 1,
        flexDirection: "column",
    },
    subtitle: {
        fontSize: "12px",
        fontWeight: "normal",
        color: "#4d4d4d",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden"
    },
    title: {
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden"
    },
    deleteButton: {
        position: "absolute",
        right: "0px"
    }
  }));

const CardTitle = ({ticket, userProfile}) => {
    const classes = useStyles();

    return (
        <div className={classes.container}>
            <Avatar
                alt={ticket.contact.name} 
                src={ticket.contact.profilePicUrl}
            />
        <div className={classes.titlesAndDeleteButtonWrapper}>    
            <div className={classes.titleAndSubtitleContainer}>
                <span className={classes.title}>
                    {ticket.contact.name}
                </span>
                <span className={classes.subtitle}>
                    {ticket.contact.number}
                </span>
            </div>
        </div>
        </div>
    )
}

export default CardTitle;