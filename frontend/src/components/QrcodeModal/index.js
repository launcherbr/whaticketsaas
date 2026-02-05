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
  DialogTitle,
  LinearProgress
} from "@material-ui/core";
import { 
  Close as CloseIcon, 
  PhoneAndroid as PhoneIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  CameraAlt as CameraIcon
} from "@material-ui/icons";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    borderRadius: 16,
    padding: 0,
    minWidth: 600,
    maxWidth: 800,
    overflow: "hidden",
    position: "relative",
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
  },
  closeButton: {
    position: "absolute",
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 1,
    color: theme.palette.text.secondary,
  },
  contentContainer: {
    display: "flex",
    flexDirection: "row",
    padding: 0,
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
    },
  },
  leftSection: {
    flex: 1,
    padding: theme.spacing(4),
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },
  rightSection: {
    flex: 1,
    padding: theme.spacing(4),
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderLeft: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down("sm")]: {
      borderLeft: "none",
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(3),
  },
  whatsappIcon: {
    color: "#25D366",
    fontSize: 32,
    marginRight: theme.spacing(1.5),
  },
  title: {
    fontWeight: 600,
    fontSize: "1.5rem",
    color: theme.palette.text.primary,
  },
  instructionsList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  instructionItem: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: theme.spacing(2.5),
  },
  stepNumber: {
    fontWeight: 600,
    marginRight: theme.spacing(1),
    color: theme.palette.text.primary,
    minWidth: 24,
  },
  stepIcon: {
    fontSize: 20,
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1.5),
    marginTop: 2,
  },
  stepText: {
    flex: 1,
    color: theme.palette.text.primary,
    fontSize: "0.95rem",
  },
  qrContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  },
  progressContainer: {
    width: "100%",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    "& .MuiLinearProgress-bar": {
      backgroundColor: "#25D366",
      borderRadius: 3,
    },
  },
  updateText: {
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  expireText: {
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    textAlign: "center",
  },
  loadingContainer: {
    width: 256,
    height: 256,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

const QrcodeModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60); // Tempo em segundos

  const socketManager = useContext(SocketContext);

  // Timer para contagem regressiva
  useEffect(() => {
    if (!open || !qrCode) return;
    
    setTimeLeft(60);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, qrCode]);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressValue = ((60 - timeLeft) / 60) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      classes={{ 
        paper: classes.dialogPaper,
        root: classes.backdrop
      }}
      BackdropProps={{
        style: { backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }
      }}
    >
      <IconButton 
        className={classes.closeButton}
        onClick={onClose}
        size="small"
      >
        <CloseIcon />
      </IconButton>
      
      <DialogContent style={{ padding: 0 }}>
        <Box className={classes.contentContainer}>
          {/* Seção Esquerda - Instruções */}
          <Box className={classes.leftSection}>
            <Box className={classes.header}>
              <Box
                component="svg"
                className={classes.whatsappIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </Box>
              <Typography variant="h6" className={classes.title}>
                Conectar ao WhatsApp Web
              </Typography>
            </Box>
            
            <Box component="ol" className={classes.instructionsList}>
              <Box component="li" className={classes.instructionItem}>
                <Typography className={classes.stepNumber}>1.</Typography>
                <PhoneIcon className={classes.stepIcon} />
                <Typography className={classes.stepText}>
                  Abra o WhatsApp no celular
                </Typography>
              </Box>
              
              <Box component="li" className={classes.instructionItem}>
                <Typography className={classes.stepNumber}>2.</Typography>
                <SettingsIcon className={classes.stepIcon} />
                <Typography className={classes.stepText}>
                  Vá em Menu ou Configurações
                </Typography>
              </Box>
              
              <Box component="li" className={classes.instructionItem}>
                <Typography className={classes.stepNumber}>3.</Typography>
                <LinkIcon className={classes.stepIcon} />
                <Typography className={classes.stepText}>
                  Selecione Dispositivos conectados
                </Typography>
              </Box>
              
              <Box component="li" className={classes.instructionItem}>
                <Typography className={classes.stepNumber}>4.</Typography>
                <CameraIcon className={classes.stepIcon} />
                <Typography className={classes.stepText}>
                  Aponte a câmera para o QR Code
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* Seção Direita - QR Code */}
          <Box className={classes.rightSection}>
            <Box className={classes.qrContainer}>
              {loading ? (
                <Box className={classes.loadingContainer}>
                  <CircularProgress />
                </Box>
              ) : qrCode ? (
                <>
                  <QRCode 
                    value={qrCode} 
                    size={isMobile ? 200 : 280} 
                    level="H" 
                    includeMargin 
                  />
                  
                  <Box className={classes.progressContainer}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressValue} 
                      className={classes.progressBar}
                    />
                  </Box>
                  
                  <Typography className={classes.updateText}>
                    Atualiza em: {formatTime(timeLeft)}
                  </Typography>
                  
                  <Typography className={classes.expireText}>
                    O QR Code expira em breve.
                  </Typography>
                </>
              ) : (
                <Box className={classes.loadingContainer}>
                  <Typography color="textSecondary">
                    {i18n.t("qrCodeModal.waiting")}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(QrcodeModal);