import React, { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { makeStyles } from "@material-ui/core/styles";
import { 
  green, 
  blue, 
  red, 
  orange,
  deepPurple,
  grey,
} from "@material-ui/core/colors";
import {
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip,
  Box,
  Divider,
  Typography,
  Tooltip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  useTheme
} from "@material-ui/core";
import {
  Edit,
  CheckCircle,
  SignalCellularConnectedNoInternet2Bar,
  SignalCellularConnectedNoInternet0Bar,
  SignalCellular4Bar,
  CropFree,
  DeleteOutline,
  Refresh,
  AddCircleOutline,
  SettingsBackupRestore,
  Phone,
  AccountCircle,
  Update,
  Brightness4,
  Brightness7
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import formatSerializedId from '../../utils/formatSerializedId';
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    padding: theme.spacing(3),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    backgroundColor: theme.palette.background.default,
  },
  gridContainer: {
    marginTop: theme.spacing(3),
  },
  connectionCard: {
    borderRadius: 12,
    boxShadow: theme.shadows[2],
    transition: "all 0.3s ease",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    border: `1px solid ${theme.palette.divider}`,
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: theme.shadows[6],
    },
  },
  cardHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: {
    padding: theme.spacing(2),
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  cardActions: {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    justifyContent: "flex-end",
    backgroundColor: theme.palette.background.paper,
  },
  avatar: {
    backgroundColor: theme.palette.primary.main,
    width: 40,
    height: 40,
    fontSize: 16,
    fontWeight: "bold",
    color: theme.palette.getContrastText(theme.palette.primary.main),
  },
  connectedStatus: {
    color: theme.palette.type === 'dark' ? green[400] : green[600],
  },
  disconnectedStatus: {
    color: theme.palette.type === 'dark' ? red[400] : red[600],
  },
  qrcodeStatus: {
    color: theme.palette.type === 'dark' ? blue[400] : blue[600],
  },
  timeoutStatus: {
    color: theme.palette.type === 'dark' ? orange[400] : orange[600],
  },
  openingStatus: {
    color: theme.palette.type === 'dark' ? deepPurple[400] : deepPurple[600],
  },
  defaultBadge: {
    backgroundColor: theme.palette.type === 'dark' ? green[800] : green[100],
    color: theme.palette.type === 'dark' ? green[100] : green[800],
    padding: "2px 8px",
    borderRadius: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    '& .MuiSvgIcon-root': {
      color: theme.palette.type === 'dark' ? green[300] : green[500],
      fontSize: 16,
    }
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1.5),
    "& svg": {
      marginRight: theme.spacing(1.5),
      color: theme.palette.text.secondary,
    },
  },
  primaryButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  secondaryButton: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  dangerButton: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.error.main}`,
    color: theme.palette.error.main,
    "&:hover": {
      backgroundColor: theme.palette.type === 'dark' ? theme.palette.error.dark : theme.palette.error.light,
    },
  },
  headerButtons: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: 'center',
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  statusIcon: {
    marginRight: theme.spacing(1.5),
  },
  progressBar: {
    marginTop: theme.spacing(1.5),
    borderRadius: 4,
    height: 6,
  },
  connectionName: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 120,
  },
  toggleThemeButton: {
    color: theme.palette.text.primary,
  },
}));

const StatusIndicator = ({ status }) => {
  const classes = useStyles();
  const theme = useTheme();
  
  const getStatusData = () => {
    switch (status) {
      case "CONNECTED":
        return {
          icon: <SignalCellular4Bar className={classes.statusIcon} />,
          text: "Conectado",
          class: classes.connectedStatus,
          progress: 100,
        };
      case "DISCONNECTED":
        return {
          icon: <SignalCellularConnectedNoInternet0Bar className={classes.statusIcon} />,
          text: "Desconectado",
          class: classes.disconnectedStatus,
          progress: 0,
        };
      case "qrcode":
        return {
          icon: <CropFree className={classes.statusIcon} />,
          text: "QR Code",
          class: classes.qrcodeStatus,
          progress: 30,
        };
      case "TIMEOUT":
      case "PAIRING":
        return {
          icon: <SignalCellularConnectedNoInternet2Bar className={classes.statusIcon} />,
          text: "Timeout",
          class: classes.timeoutStatus,
          progress: 60,
        };
      case "OPENING":
        return {
          icon: <CircularProgress size={16} className={classes.statusIcon} />,
          text: "Conectando",
          class: classes.openingStatus,
          progress: 45,
        };
      default:
        return {
          icon: <SignalCellularConnectedNoInternet0Bar className={classes.statusIcon} />,
          text: status,
          class: classes.disconnectedStatus,
          progress: 0,
        };
    }
  };
  
  const statusData = getStatusData();
  
  return (
    <Box display="flex" alignItems="center" mb={2}>
      {React.cloneElement(statusData.icon, { 
        style: { color: theme.palette[statusData.class.replace(classes.statusIcon, '').trim()] } 
      })}
      <Typography variant="body2" className={statusData.class}>
        {statusData.text}
      </Typography>
      <Box flexGrow={1} ml={1.5}>
        <LinearProgress 
          variant="determinate" 
          value={statusData.progress} 
          className={classes.progressBar}
          style={{ 
            backgroundColor: theme.palette.divider,
          }}
          classes={{
            bar: {
              backgroundColor: theme.palette[statusData.class.replace(classes.statusIcon, '').trim()]
            }
          }}
        />
      </Box>
    </Box>
  );
};

const Connections = () => {
  const classes = useStyles();
  const theme = useTheme();

  const { user } = useContext(AuthContext);
  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false,
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(
    confirmationModalInitialState
  );

  const handleStartWhatsAppSession = async whatsAppId => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}`);
      toast.info(i18n.t("connections.toasts.connecting"));
    } catch (err) {
      toastError(err);
    }
  };

  const handleRequestNewQrCode = async whatsAppId => {
    try {
      await api.put(`/whatsappsession/${whatsAppId}`);
      toast.info(i18n.t("connections.toasts.requestingQr"));
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setSelectedWhatsApp, setWhatsAppModalOpen]);

  const handleOpenQrModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, [setQrModalOpen, setSelectedWhatsApp]);

  const handleEditWhatsApp = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const handleOpenConfirmationModal = (action, whatsAppId) => {
    if (action === "disconnect") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.disconnectTitle"),
        message: i18n.t("connections.confirmationModal.disconnectMessage"),
        whatsAppId: whatsAppId,
      });
    }

    if (action === "delete") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.deleteTitle"),
        message: i18n.t("connections.confirmationModal.deleteMessage"),
        whatsAppId: whatsAppId,
      });
    }
    setConfirmModalOpen(true);
  };

  const handleSubmitConfirmationModal = async () => {
    if (confirmModalInfo.action === "disconnect") {
      try {
        await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.disconnected"));
      } catch (err) {
        toastError(err);
      }
    }

    if (confirmModalInfo.action === "delete") {
      try {
        await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.deleted"));
      } catch (err) {
        toastError(err);
      }
    }

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const renderCardActions = whatsApp => {
    return (
      <>
        {whatsApp.status === "qrcode" && (
          <Button
            size="small"
            variant="contained"
            className={classes.primaryButton}
            startIcon={<CropFree />}
            onClick={() => handleOpenQrModal(whatsApp)}
            fullWidth
          >
            {i18n.t("connections.buttons.qrcode")}
          </Button>
        )}
        {whatsApp.status === "DISCONNECTED" && (
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="contained"
                className={classes.secondaryButton}
                startIcon={<Refresh />}
                onClick={() => handleStartWhatsAppSession(whatsApp.id)}
                fullWidth
              >
                {i18n.t("connections.buttons.tryAgain")}
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                size="small"
                variant="contained"
                className={classes.primaryButton}
                startIcon={<CropFree />}
                onClick={() => handleRequestNewQrCode(whatsApp.id)}
                fullWidth
              >
                {i18n.t("connections.buttons.newQr")}
              </Button>
            </Grid>
          </Grid>
        )}
        {(whatsApp.status === "CONNECTED" ||
          whatsApp.status === "PAIRING" ||
          whatsApp.status === "TIMEOUT") && (
          <Button
            size="small"
            variant="contained"
            className={classes.dangerButton}
            startIcon={<SignalCellularConnectedNoInternet0Bar />}
            onClick={() => {
              handleOpenConfirmationModal("disconnect", whatsApp.id);
            }}
            fullWidth
          >
            {i18n.t("connections.buttons.disconnect")}
          </Button>
        )}
        {whatsApp.status === "OPENING" && (
          <Button 
            size="small" 
            variant="contained" 
            disabled 
            className={classes.secondaryButton}
            startIcon={<CircularProgress size={14} />}
            fullWidth
          >
            {i18n.t("connections.buttons.connecting")}
          </Button>
        )}
      </>
    );
  };

  const restartWhatsapps = async () => {
    try {
      await api.post(`/whatsapp-restart/`);
      toast.warn(i18n.t("Aguarde... reiniciando..."));
    } catch (err) {
      toastError(err);
    }
  }

  const formatConnectionName = (name) => {
    if (name.length > 9) {
      return `${name.substring(0, 9)}...`;
    }
    return name;
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleSubmitConfirmationModal}
      >
        {confirmModalInfo.message}
      </ConfirmationModal>
      <QrcodeModal
        open={qrModalOpen}
        onClose={handleCloseQrModal}
        whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
      />
      <WhatsAppModal
        open={whatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
      />
      <MainHeader>
        <Title>{i18n.t("connections.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Can
            role={user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <div className={classes.headerButtons}>
                <Button
                  variant="contained"
                  className={classes.primaryButton}
                  startIcon={<AddCircleOutline />}
                  onClick={handleOpenWhatsAppModal}
                >
                  {i18n.t("connections.buttons.add")}
                </Button>
                <Button
                  variant="contained"
                  className={classes.secondaryButton}
                  startIcon={<SettingsBackupRestore />}
                  onClick={restartWhatsapps}
                >
                  {i18n.t("connections.buttons.restart")}
                </Button>
                <IconButton
                  className={classes.toggleThemeButton}
                  onClick={() => theme.toggleTheme && theme.toggleTheme()}
                  aria-label="toggle theme"
                >
                  {theme.palette.type === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </div>
            )}
          />
        </MainHeaderButtonsWrapper>
      </MainHeader>
      
      <Paper className={classes.root} elevation={0}>
        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress color="primary" />
          </div>
        ) : (
          <>
            <Box mb={3}>
              <Typography variant="h6" color="textPrimary">
                {i18n.t("connections.subtitle")} · {whatsApps?.length || 0} conexões
              </Typography>
              <Divider />
            </Box>
            
            {whatsApps?.length > 0 ? (
              <Grid container spacing={3} className={classes.gridContainer}>
                {whatsApps.map(whatsApp => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={whatsApp.id}>
                    <Card className={classes.connectionCard}>
                      <Box className={classes.cardHeader}>
                        <Box display="flex" alignItems="center" minWidth={0}>
                          <Avatar className={classes.avatar}>
                            {whatsApp.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box ml={1.5} minWidth={0}>
                            <Tooltip title={whatsApp.name} arrow>
                              <Typography variant="subtitle1" className={classes.connectionName}>
                                {formatConnectionName(whatsApp.name)}
                              </Typography>
                            </Tooltip>
                            <Typography variant="caption" color="textSecondary" noWrap>
                              ID: {whatsApp.id}
                            </Typography>
                          </Box>
                        </Box>
                        {whatsApp.isDefault && (
                          <Chip
                            label="Padrão"
                            size="small"
                            icon={<CheckCircle fontSize="small" />}
                            className={classes.defaultBadge}
                          />
                        )}
                      </Box>
                      
                      <CardContent className={classes.cardContent}>
                        <StatusIndicator status={whatsApp.status} />
                        
                        <Box className={classes.infoItem}>
                          <Phone fontSize="small" />
                          <Typography variant="body2" noWrap>
                            {whatsApp.number ? (
                              <Tooltip title={whatsApp.number} arrow>
                                <span>{formatSerializedId(whatsApp.number)}</span>
                              </Tooltip>
                            ) : (
                              "Número não definido"
                            )}
                          </Typography>
                        </Box>
                        
                        <Box className={classes.infoItem}>
                          <Update fontSize="small" />
                          <Typography variant="body2">
                            {format(parseISO(whatsApp.updatedAt), "dd/MM/yyyy HH:mm")}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions className={classes.cardActions}>
                        <Box width="100%">
                          {renderCardActions(whatsApp)}
                          
                          <Can
                            role={user.profile}
                            perform="connections-page:editOrDeleteConnection"
                            yes={() => (
                              <Box mt={1} display="flex" justifyContent="space-between">
                                <Button
                                  size="small"
                                  startIcon={<Edit />}
                                  onClick={() => handleEditWhatsApp(whatsApp)}
                                  color="primary"
                                >
                                  Editar
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<DeleteOutline />}
                                  onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
                                  color="secondary"
                                >
                                  Excluir
                                </Button>
                              </Box>
                            )}
                          />
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box className={classes.emptyState}>
                <AccountCircle style={{ fontSize: 60, color: theme.palette.text.disabled }} />
                <Typography variant="h6" gutterBottom>
                  Nenhuma conexão encontrada
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Clique no botão "Adicionar Conexão" para começar
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </MainContainer>
  );
};

export default Connections;