import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(2),
  },
  title: {
    paddingBottom: 0,
  },
  textBold: {
    fontWeight: 'bold',
  },
}));

const ShowTicketOpenModal = ({ isOpen, handleClose, ticketData, user, queue }) => {
  const classes = useStyles();
  const history = useHistory();

  const handleClickTicket = () => {
    handleClose();
    if (ticketData?.id) {
      history.push(`/tickets/${ticketData.id}`);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle className={classes.title}>
        Ticket em Atendimento
      </DialogTitle>
      <DialogContent className={classes.content}>
        <Typography paragraph>
          Este contato já possui um ticket em atendimento com:
        </Typography>
        <Typography paragraph>
          <span className={classes.textBold}>Atendente: </span>
          {ticketData?.user?.name || user || "Não atribuído"}
        </Typography>
        <Typography paragraph>
          <span className={classes.textBold}>Fila: </span>
          {ticketData?.queue?.name || queue || "Não atribuído"}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose}
          color="secondary"
          variant="outlined"
        >
          Fechar
        </Button>
        {ticketData?.id && (
          <Button 
            onClick={handleClickTicket}
            color="primary"
            variant="contained"
          >
            Ir para o Ticket
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShowTicketOpenModal;