import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  makeStyles
} from "@material-ui/core";
import WarningIcon from "@material-ui/icons/Warning";
import PersonIcon from "@material-ui/icons/Person";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
  warningIcon: {
    fontSize: 64,
    color: theme.palette.warning.main,
    marginBottom: theme.spacing(2),
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  },
  personIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

const TicketAlreadyOpenModal = ({ open, onClose, attendingUserName }) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="center">
          <WarningIcon className={classes.warningIcon} />
        </Box>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Typography variant="h6" gutterBottom>
          Ticket já está em atendimento
        </Typography>
        {attendingUserName && attendingUserName !== "Nenhum atendente" ? (
          <Typography variant="body1" color="textSecondary" paragraph>
            <strong>{attendingUserName}</strong> está atendendo esse ticket
          </Typography>
        ) : (
          <Typography variant="body2" color="textSecondary" paragraph>
            Este ticket já está em atendimento.
          </Typography>
        )}
        {attendingUserName && attendingUserName !== "Nenhum atendente" && (
          <Box className={classes.userInfo}>
            <PersonIcon className={classes.personIcon} />
            <Typography variant="body1" fontWeight="bold">
              {attendingUserName}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained" fullWidth>
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketAlreadyOpenModal;

