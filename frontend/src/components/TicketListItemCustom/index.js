import React, { useContext, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { format, isSameDay, parseISO } from "date-fns";
import { useHistory, useParams } from "react-router-dom";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
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
    margin: "8px 0",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
      transform: "translateY(-2px)",
    },
  },
  pendingTicket: {
    cursor: "unset",
    backgroundColor: theme.palette.ticketlist.main,
  },
  selectedTicket: {
    backgroundColor: "#e3f2fd",
  },
  ticketQueueColor: {
    width: "6px",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderTopLeftRadius: "8px",
    borderBottomLeftRadius: "8px",
  },
  eyeIcon: {
    fontSize: "16px",
    marginLeft: "4px",
    color: blue[500],
    cursor: "pointer",
    verticalAlign: "middle",
  },
  avatar: {
    width: "60px",
    height: "60px",
    marginRight: "12px",
    position: "relative",
  },
  avatarBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    transform: "translate(-30%, -30%)",
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  timeLabel: {
    fontSize: "0.75rem",
    color: theme.palette.common.white,
    backgroundColor: theme.palette.common.black,
    padding: "2px 8px",
    borderRadius: "12px",
    marginRight: "8px",
    fontWeight: 500,
    minWidth: "40px",
    textAlign: "center",
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    flexGrow: 1,
    overflow: 'hidden',
  },
  contactName: {
    fontWeight: "bold",
    fontSize: "0.95rem",
    color: theme.palette.text.primary,
    display: "flex",
    alignItems: "center",
  },
  whatsappIcon: {
    fontSize: "16px",
    marginLeft: "4px",
    color: green[500],
  },
  lastMessage: {
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
  },
  unreadBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: green[500],
      color: "white",
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
    fontSize: "0.75rem",
    marginLeft: "4px",
    "&.recent": { color: green[500] },
    "&.warning": { color: orange[500] },
    "&.critical": { color: red[500] },
  },
  actionIcon: {
    fontSize: "22px",
    cursor: "pointer",
    margin: "0 4px",
    "&:hover": {
      opacity: 0.8,
    },
  },  chatbotIcon: {
    fontSize: "16px",
    marginLeft: "4px",
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
    if (ticket.userId && ticket.user) {
      setTicketUser(ticket.user?.name);
    }
    setTag(ticket?.tags);

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
                className={classes.actionIcon}
                style={{ color: green[500] }}
                onClick={() => handleAcceptTicket(ticket.id)}
              />
            </Tooltip>
            <Tooltip title="Recusar">
              <CloseIcon
                className={classes.actionIcon}
                style={{ color: red[500] }}
                onClick={() => handleCloseTicket(ticket.id)}
              />
            </Tooltip>
          </>
        );
      case "closed":
        return (
          <Tooltip title="Reabrir">
            <ReplayIcon
              className={classes.actionIcon}
              style={{ color: blue[500] }}
              onClick={() => handleReopenTicket(ticket.id)}
            />
          </Tooltip>
        );
      default:
        return (
          <>
            <Tooltip title="Transferir">
              <TransferWithinAStationIcon
                className={classes.actionIcon}
                style={{ color: blue[500] }}
                onClick={handleTransferTicket}
              />
            </Tooltip>
            <Tooltip title="Fechar">
              <CloseIcon
                className={classes.actionIcon}
                style={{ color: red[500] }}
                onClick={() => handleCloseTicket(ticket.id)}
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
        <span
          style={{ backgroundColor: ticket.queue?.color || grey[500] }}
          className={classes.ticketQueueColor}
        />

        <ListItemAvatar>
          <div className={classes.avatar}>
            <Avatar
              src={ticket?.contact?.profilePicUrl}
              style={{ 
                width: "100%",
                height: "100%",
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
              <Typography className={classes.timeLabel}>
                {getTimeLabel()}
              </Typography>
              <Box className={classes.nameContainer}>
                <Typography className={classes.contactName}>
                  {truncateText(ticket.contact.name, 21)}
                  <Tooltip title="WhatsApp">
                    <WhatsAppIcon className={classes.whatsappIcon} />
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
                </Typography>
              </Box>
            </Box>
          }
          secondary={
            <>
              {ticket.presence && (
                <span className={classes.presenceIndicator}>
                  {presenceMessage[ticket.presence] || ticket.presence}
                </span>
              )}

              <Typography className={classes.lastMessage}>
                {ticket.lastMessage.includes('data:image/png;base64')
                  ? "Localização"
                  : <MarkdownWrapper>{truncateText(ticket.lastMessage, 21)}</MarkdownWrapper>}
              </Typography>              <Box className={classes.mainContainer}>
                <Box className={classes.infoContainer}>
                  {ticket.whatsapp?.name && (
                    <Tooltip title={`Conexão: ${ticket.whatsapp.name}`}>
                      <span className={clsx(classes.tagBadge, classes.connectionBadge)}>
                        <AndroidIcon className={classes.tagBadgeIcon} />
                        <span className={classes.tagBadgeText}>{ticket.whatsapp.name}</span>
                      </span>
                    </Tooltip>
                  )}
                  {ticketUser && (
                    <Tooltip title={`Atendente: ${ticketUser}`}>
                      <span className={clsx(classes.tagBadge, classes.agentBadge)}>
                        <FaceIcon className={classes.tagBadgeIcon} />
                        <span className={classes.tagBadgeText}>{ticketUser}</span>
                      </span>
                    </Tooltip>
                  )}
                  {ticket.queue?.name && (
                    <Tooltip title={`Fila: ${ticket.queue.name}`}>
                      <span 
                        className={clsx(classes.tagBadge, classes.queueBadge)}
                        style={{ backgroundColor: ticket.queue.color ? `${ticket.queue.color}30` : grey[100] }}
                      >
                        <span className={classes.tagBadgeIcon}>Q</span>
                        <span className={classes.tagBadgeText}>{ticket.queue.name}</span>
                      </span>
                    </Tooltip>
                  )}
                </Box>
                {tag && tag.length > 0 && (
                  <Box className={classes.tagContainer}>
                    <span className={classes.tagLabel}>Tags:</span>
                    <Box className={classes.tagList}>
                      {tag.map((tag) => (
                        <Tooltip key={tag.id} title={`Tag: ${tag.name}`}>
                          <span 
                            className={classes.tagPill}
                            style={{ 
                              backgroundColor: tag.color ? `${tag.color}30` : grey[100],
                              color: tag.color || grey[600],
                              borderColor: tag.color || grey[400],
                            }}
                          >
                            <span className={classes.tagHash}>#</span>
                            {tag.name}
                          </span>
                        </Tooltip>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          }
        />

        <ListItemSecondaryAction>
          <Box display="flex">
            {renderStatusIcons()}
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
      <Divider variant="inset" component="li" />
    </>
  );
};

export default TicketListItemCustom;
