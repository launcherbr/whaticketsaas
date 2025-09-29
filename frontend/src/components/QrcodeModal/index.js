import React, { useEffect, useState, useContext } from "react";
import QRCode from "qrcode.react";
import toastError from "../../errors/toastError";
import {
  Dialog,
  DialogContent,
  Typography,
  useTheme,
  Box,
  CircularProgress,
  useMediaQuery,
  IconButton,
  DialogTitle
} from "@material-ui/core";
import { Close as CloseIcon, MoreVert as MoreVertIcon, Settings as SettingsIcon } from "@material-ui/icons";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    borderRadius: 16,
    padding: theme.spacing(1),
    minWidth: 320,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  contentContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: theme.spacing(4),
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      padding: theme.spacing(2),
    },
  },
  instructions: {
    maxWidth: 400,
    marginRight: theme.spacing(4),
    [theme.breakpoints.down("sm")]: {
      marginRight: 0,
      marginBottom: theme.spacing(4),
      maxWidth: "100%",
    },
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: theme.spacing(2),
    "& svg": {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
    },
  },
  qrContainer: {
    padding: theme.spacing(2),
    backgroundColor: "white",
    borderRadius: 8,
    boxShadow: theme.shadows[2],
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  qrWithLogo: {
    position: "relative",
    display: "inline-block",
  },
  whatsappLogo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "40%",
    height: "40%",
    padding: "8%",
  },
  loadingContainer: {
    width: 256,
    height: 256,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
}));

const QrcodeModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;
      setLoading(true);

      try {
        const { data } = await api.get(`/whatsapp/${whatsAppId}`);
        setQrCode(data.qrcode);
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  useEffect(() => {
    if (!whatsAppId) return;
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-whatsappSession`, (data) => {
      if (data.action === "update" && data.session.id === whatsAppId) {
        setQrCode(data.session.qrcode);
        setLoading(false);
      }

      if (data.action === "update" && data.session.qrcode === "") {
        onClose();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [whatsAppId, onClose, socketManager]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogTitle disableTypography className={classes.header}>
        <Typography variant="h6" className={classes.title}>
          {i18n.t("qrCodeModal.title")}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box className={classes.contentContainer}>
          <Box className={classes.instructions}>
            <Typography variant="h6" gutterBottom style={{ fontWeight: 600, marginBottom: 24 }}>
              Como conectar seu WhatsApp:
            </Typography>
            
            <Box className={classes.step}>
              <Typography variant="body1" color="textPrimary">
                <strong>1.</strong> Abra o WhatsApp no seu celular
              </Typography>
            </Box>
            
            <Box className={classes.step}>
              <MoreVertIcon fontSize="small" />
              <Typography variant="body1" color="textPrimary">
                <strong>2.</strong> Toque em <strong>Mais opções</strong> no Android ou em <strong>Configurações</strong> no iPhone
              </Typography>
            </Box>
            
            <Box className={classes.step}>
              <SettingsIcon fontSize="small" />
              <Typography variant="body1" color="textPrimary">
                <strong>3.</strong> Toque em <strong>Dispositivos conectados</strong> e depois em <strong>Conectar dispositivos</strong>
              </Typography>
            </Box>
            
            <Box className={classes.step}>
              <Typography variant="body1" color="textPrimary">
                <strong>4.</strong> Aponte a câmera do celular para esta tela para escanear o QR Code
              </Typography>
            </Box>
            
            <Typography variant="caption" display="block" style={{ marginTop: 16, color: theme.palette.text.secondary }}>
              O QR Code atualiza automaticamente a cada 60 segundos
            </Typography>
          </Box>
          
          <Box className={classes.qrContainer}>
            {loading ? (
              <Box className={classes.loadingContainer}>
                <CircularProgress />
              </Box>
            ) : qrCode ? (
              <>
                <Box className={classes.qrWithLogo}>
                  <QRCode 
                    value={qrCode} 
                    size={isMobile ? 200 : 256} 
                    level="H" 
                    includeMargin 
                  />
                  <img 
                    src="/static/whatsapp-logo.png" 
                    alt="WhatsApp Logo"
                    className={classes.whatsappLogo}
                  />
                </Box>
                <Typography variant="caption" style={{ marginTop: 8 }}>
                  {new Date().toLocaleTimeString()}
                </Typography>
              </>
            ) : (
              <Box className={classes.loadingContainer}>
                <Typography color="textSecondary">
                  Aguardando geração do QR Code...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);