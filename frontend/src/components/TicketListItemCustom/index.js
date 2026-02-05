import React, { useContext, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { format, isSameDay, parseISO } from "date-fns";
import { useHistory, useParams } from "react-router-dom";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import { blue, green, grey, orange, red } from "@material-ui/core/colors";
import { makeStyles } from "@material-ui/core/styles";
import { Tooltip } from "@material-ui/core";
import { v4 as uuidv4 } from "uuid";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import TicketMessagesDialog from "../TicketMessagesDialog";
import MarkdownWrapper from "../MarkdownWrapper";
import AndroidIcon from "@material-ui/icons/Android";
import CheckIcon from "@material-ui/icons/Check";
import CloseIcon from "@material-ui/icons/Close";
import ReplayIcon from "@material-ui/icons/Replay";
import TransferWithinAStationIcon from "@material-ui/icons/TransferWithinAStation";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import FaceIcon from "@material-ui/icons/Face";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import TransferTicketModal from "../TransferTicketModalCustom";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
    margin: "0px",
    padding: "12px 60px 12px 28px",
    borderRadius: "0px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: "all 0.2s ease",
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  pendingTicket: {
    cursor: "unset",
    backgroundColor: theme.palette.ticketlist.main,
  },
  selectedTicket: {
    backgroundColor: theme.palette.action.selected,
  },
  ticketQueueColor: {
    minWidth: "4px",
    width: "auto",
    maxWidth: "25px",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: "0px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 1px",
    overflow: "hidden",
  },
  queueLabel: {
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    fontSize: "0.55rem",
    fontWeight: "700",
    color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    textTransform: "uppercase",
  },
  eyeIcon: {
    fontSize: "14px",
    marginLeft: "4px",
    color: blue[500],
    cursor: "pointer",
    "&:hover": {
      color: blue[700],
      opacity: 0.8,
    },
  },
  whatsappNameBox: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  whatsappName: {
    fontSize: "0.65rem",
    color: green[600],
    fontWeight: 600,
  },
  avatar: {
    width: "55px",
    height: "55px",
    marginRight: "10px",
    position: "relative",
    "& .MuiAvatar-root": {
      borderRadius: "8px",
    },
  },
  avatarBadge: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '2px',
    paddingRight: '0px',
  },
  timeLabel: {
    fontSize: "0.65rem",
    color: theme.palette.text.secondary,
    fontWeight: 400,
    whiteSpace: "nowrap",
    marginLeft: "4px",
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    overflow: 'hidden',
  },
  contactName: {
    fontWeight: "700",
    fontSize: "0.95rem",
    color: theme.palette.text.primary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "180px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.7rem",
    fontWeight: "600",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  statusBadgePending: {
    backgroundColor: "#ffc107",
    color: "#000",
  },
  statusBadgeOpen: {
    backgroundColor: "#28a745",
    color: "#fff",
  },
  statusBadgeClosed: {
    backgroundColor: "#dc3545",
    color: "#fff",
  },
  whatsappIcon: {
    fontSize: "14px",
    color: green[500],
  },
  lastMessage: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    "-webkit-line-clamp": 1,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    marginTop: "2px",
  },
  unreadBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText || "white",
      fontWeight: "bold",
      fontSize: "0.65rem",
    },
  },  tagContainer: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "4px",
  },
  tagCircle: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  connectionCircle: {
    backgroundColor: green[100],
    color: green[600],
  },
  agentCircle: {
    backgroundColor: blue[100],
    color: blue[600],
  },
  queueCircle: {
    backgroundColor: grey[100],
    color: grey[600],
  },
  tagIcon: {
    fontSize: "14px",
  },  tagBadge: {
    display: "flex",
    alignItems: "center",
    borderRadius: "12px",
    padding: "2px 8px",
    fontSize: "0.75rem",
    fontWeight: "500",
    height: "22px",
    maxWidth: "130px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tagBadgeIcon: {
    fontSize: "12px",
    marginRight: "4px",
  },
  tagBadgeText: {
    fontSize: "0.7rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  customTagBadge: {
    border: "1px solid",
    borderRadius: "4px",
    padding: "2px 6px",
    position: "relative",
  },
  tagIndicator: {
    fontWeight: "bold",
    fontSize: "0.8rem",
    marginRight: "4px",
  },
  connectionBadge: {
    backgroundColor: green[100],
    color: green[600],
  },
  agentBadge: {
    backgroundColor: blue[100],
    color: blue[600],
  },
  queueBadge: {
    backgroundColor: grey[100],
    color: grey[600],
  },
  presenceIndicator: {
    color: green[500],
    fontWeight: "bold",
    fontSize: "0.8rem",
  },
  interactionTime: {
    fontSize: "0.7rem",
    marginLeft: "6px",
    fontWeight: "600",
    "&.recent": { color: green[500] },
    "&.warning": { color: orange[500] },
    "&.critical": { color: red[500] },
  },
  actionIcon: {
    fontSize: "22px",
    cursor: "pointer",
    margin: "2px 0",
    padding: "2px",
    color: blue[500],
    "&:hover": {
      opacity: 0.7,
    },
  },
  actionIconSuccess: {
    color: green[500],
  },
  actionIconDanger: {
    color: red[500],
  },
  secondaryActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
  },  chatbotIcon: {
    fontSize: "13px",
    marginLeft: "3px",
    color: grey[600],
  },
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    marginTop: "4px",
  },
  infoContainer: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "6px",
  },
  tagContainer: {
    display: "flex",
    alignItems: "center",
    backgroundColor: grey[100],
    borderRadius: "6px",
    padding: "4px 8px",
    marginTop: "4px",
    width: "100%",
    gap: "6px",
  },
  tagLabel: {
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: grey[700],
    whiteSpace: "nowrap",
  },
  tagList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    flex: 1,
  },
  tagPill: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "20px",
    padding: "2px 8px",
    fontSize: "0.75rem",
    fontWeight: "500",
    border: "1px solid",
    whiteSpace: "nowrap",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  },
  tagHash: {
    fontWeight: "bold",
    marginRight: "3px",
    fontSize: "0.8rem",
  },
}));

const TicketListItemCustom = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [ticketUser, setTicketUser] = useState(null);
  const [tag, setTag] = useState([]);
  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const initialTagsRef = useRef(null);
  const initialUserRef = useRef(null);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);
  const { profile } = user;
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
  const presenceMessage = { 
    composing: "Digitando...", 
    recording: "Gravando áudio...",
    paused: "Pausado",
    available: "Online",
    unavailable: "Offline"
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  useEffect(() => {
    // Armazena o usuário do ticket
    if (ticket.userId && ticket.user) {
      const userName = ticket.user?.name;
      if (userName && !initialUserRef.current) {
        initialUserRef.current = userName;
      }
      setTicketUser(initialUserRef.current || userName);
    }
    
    // Armazena as tags do ticket
    if (ticket?.tags && ticket.tags.length > 0) {
      if (!initialTagsRef.current || initialTagsRef.current.length === 0) {
        initialTagsRef.current = ticket.tags;
      }
      setTag(initialTagsRef.current);
    } else if (initialTagsRef.current) {
      // Mantém as tags iniciais mesmo se o ticket vier sem tags
      setTag(initialTagsRef.current);
    }

    return () => {
      isMounted.current = false;
    };
  }, [ticket]);

  const getTimeLabel = () => {
    if (!ticket.updatedAt) return "";
    const lastInteractionDate = parseISO(ticket.updatedAt);
    return isSameDay(lastInteractionDate, new Date())
      ? format(lastInteractionDate, "HH:mm")
      : format(lastInteractionDate, "dd/MM/yyyy");
  };

  const getInteractionTimeLabel = () => {
    if (!ticket.lastMessage) return null;

    const lastInteractionDate = parseISO(ticket.updatedAt);
    const currentDate = new Date();
    const timeDifference = currentDate - lastInteractionDate;
    const minutesDifference = Math.floor(timeDifference / (1000 * 60));
    const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));

    if (minutesDifference < 3) return null;
    
    let labelText = "";
    let className = "";
    
    if (minutesDifference < 30) {
      labelText = `${minutesDifference}m`;
      className = "recent";
    } else if (hoursDifference < 24) {
      labelText = `${hoursDifference}h`;
      className = hoursDifference > 1 ? "warning" : "recent";
    } else {
      labelText = `${Math.floor(hoursDifference / 24)}d`;
      className = "critical";
    }

    return (
      <span className={`${classes.interactionTime} ${className}`}>
        {labelText}
      </span>
    );
  };

  const handleCloseTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: user?.id,
        queueId: ticket?.queue?.id,
      });
      history.push("/tickets/");
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleReopenTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
        queueId: ticket?.queue?.id,
      });
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleSendMessage = async (id) => {
        
    const msg = `{{ms}} *{{name}}*, meu nome é *${user?.name}* e agora vou prosseguir com seu atendimento!`;
    const message = {
        read: 1,
        fromMe: true,
        mediaUrl: "",
        body: `*Mensagem Automática:*\n${msg.trim()}`,
    };
    try {
        await api.post(`/messages/${id}`, message);
    } catch (err) {
        toastError(err);
        
    }
};

  const handleAcceptTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "open",
        userId: user?.id,
      });
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      // Verificar se é erro de ticket já aberto
      const errorMessage = err?.response?.data?.error || err?.message || "";
      if (errorMessage.includes("TICKET_ALREADY_OPEN")) {
        const parts = errorMessage.split("|");
        if (parts.length >= 2) {
          const attendingName = parts[1] || "Atendente";
          toastError(`Este ticket já está sendo atendido por: ${attendingName}`);
        } else {
          toastError("Este ticket já está sendo atendido por outro atendente.");
        }
      } else {
        toastError(err);
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleTransferTicket = () => {
    setTransferTicketModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setTransferTicketModalOpen(false);
  };

  const handleSelectTicket = () => {
    if (ticket.status === "pending") return;
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
  };

  const renderStatusIcons = () => {
    switch (ticket.status) {
      case "pending":
        return (
          <>
            <Tooltip title="Aceitar">
              <CheckIcon
                className={clsx(classes.actionIcon, classes.actionIconSuccess)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptTicket(ticket.id);
                }}
              />
            </Tooltip>
            <Tooltip title="Recusar">
              <CloseIcon
                className={clsx(classes.actionIcon, classes.actionIconDanger)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTicket(ticket.id);
                }}
              />
            </Tooltip>
          </>
        );
      case "closed":
        return (
          <Tooltip title="Reabrir">
            <ReplayIcon
              className={classes.actionIcon}
              onClick={(e) => {
                e.stopPropagation();
                handleReopenTicket(ticket.id);
              }}
            />
          </Tooltip>
        );
      default:
        return (
          <>
            <Tooltip title="Transferir">
              <TransferWithinAStationIcon
                className={classes.actionIcon}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTransferTicket();
                }}
              />
            </Tooltip>
            <Tooltip title="Fechar">
              <CloseIcon
                className={clsx(classes.actionIcon, classes.actionIconDanger)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTicket(ticket.id);
                }}
              />
            </Tooltip>
          </>
        );
    }
  };

  return (
    <>
      <TransferTicketModal
        modalOpen={transferTicketModalOpen}
        onClose={handleCloseTransferModal}
        ticketid={ticket.id}
      />

      <TicketMessagesDialog
        open={openTicketMessageDialog}
        handleClose={() => setOpenTicketMessageDialog(false)}
        ticketId={ticket.id}
      />
      
      <ListItem
        button
        onClick={handleSelectTicket}
        selected={ticketId && +ticketId === ticket.id}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
          [classes.selectedTicket]: ticketId && +ticketId === ticket.id,
        })}
      >
        <Tooltip
          arrow
          placement="left"
          title={ticket.queue?.name || "Sem Fila"}
      >
        <span
          style={{ backgroundColor: ticket.queue?.color || grey[500] }}
          className={classes.ticketQueueColor}
          >
            <span className={classes.queueLabel}>
              {ticket.queue?.name || "SEM FILA"}
            </span>
          </span>
        </Tooltip>

        <ListItemAvatar>
          <div className={classes.avatar}>
            <Avatar
              src={ticket?.contact?.profilePicUrl}
              style={{ 
                width: "100%",
                height: "100%",
                borderRadius: "8px",
                backgroundColor: generateColor(ticket?.contact?.number) 
              }}
            >
              {getInitials(ticket?.contact?.name || "")}
            </Avatar>
            {ticket.unreadMessages > 0 && (
              <Badge
                badgeContent={ticket.unreadMessages}
                className={clsx(classes.unreadBadge, classes.avatarBadge)}
              />
            )}
          </div>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Box className={classes.headerContainer}>
              <Box className={classes.nameContainer}>
                <Tooltip title={ticket.contact.name}>
                  <Typography className={classes.contactName}>
                    {truncateText(ticket.contact.name, 25)}
                  </Typography>
                </Tooltip>
                <Tooltip title={ticket.whatsapp?.name || "WhatsApp"}>
                  <Box className={classes.whatsappNameBox}>
                    <WhatsAppIcon className={classes.whatsappIcon} />
                    <Typography className={classes.whatsappName}>
                      {truncateText(ticket.whatsapp?.name || "", 8)}
                    </Typography>
                  </Box>
                  </Tooltip>
                  {ticket.chatbot && (
                    <Tooltip title="Chatbot">
                      <AndroidIcon className={classes.chatbotIcon} />
                    </Tooltip>
                  )}
                  <Tooltip title="Visualizar conversa">
                    <VisibilityIcon 
                      className={classes.eyeIcon}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTicketMessageDialog(true);
                      }}
                    />
                  </Tooltip>
                  {getInteractionTimeLabel()}
              </Box>
              <Typography className={classes.timeLabel}>
                {getTimeLabel()}
              </Typography>
            </Box>
          }
          secondary={
            <>
              <Typography className={classes.lastMessage}>
                {ticket.lastMessage.includes('data:image/png;base64')
                  ? "📍 Localização"
                  : <MarkdownWrapper>{truncateText(ticket.lastMessage, 65)}</MarkdownWrapper>}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap="4px" mt={0.5} alignItems="center">
                  {ticketUser && (
                    <Tooltip title={`Atendente: ${ticketUser}`}>
                      <span 
                      style={{ 
                        backgroundColor: blue[500],
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                      }}
                    >
                      <FaceIcon style={{ fontSize: "0.75rem" }} />
                      {ticketUser}
                      </span>
                    </Tooltip>
                  )}
                {tag && tag.length > 0 && tag.map((t) => (
                  <Tooltip key={t.id} title={t.name}>
                          <span 
                            style={{ 
                        backgroundColor: t.color || grey[300],
                        color: "#fff",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        display: "inline-block",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                      }}
                    >
                      #{t.name}
                          </span>
                        </Tooltip>
                      ))}
              </Box>
            </>
          }
        />

        <ListItemSecondaryAction className={classes.secondaryActions}>
            {renderStatusIcons()}
        </ListItemSecondaryAction>
      </ListItem>
    </>
  );
};

export default TicketListItemCustom;
