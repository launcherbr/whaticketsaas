import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Snackbar,
  makeStyles
} from "@material-ui/core";
import { green } from "@material-ui/core/colors";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles((theme) => ({
  dialog: {
    "& .MuiDialog-paper": {
      minWidth: "400px",
    },
  },
  pixBox: {
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
  },
  pixText: {
    fontFamily: "monospace",
    wordBreak: "break-all",
    fontSize: "0.875rem",
    marginBottom: theme.spacing(1),
  },
  copyButton: {
    backgroundColor: green[500],
    color: "#fff",
    "&:hover": {
      backgroundColor: green[700],
    },
  },
  title: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));

const PixModal = ({ open, onClose, pixKey }) => {
  const classes = useStyles();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        className={classes.dialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box className={classes.title}>
            <Typography variant="h6">Chave PIX</Typography>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Copie a chave PIX abaixo para realizar o pagamento:
          </Typography>
          <Box className={classes.pixBox}>
            <Typography className={classes.pixText}>{pixKey}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="default">
            Fechar
          </Button>
          <Button
            onClick={handleCopyPix}
            variant="contained"
            className={classes.copyButton}
            startIcon={<FileCopyIcon />}
          >
            Copiar PIX
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        message="PIX copiado para área de transferência!"
      />
    </>
  );
};

export default PixModal;
