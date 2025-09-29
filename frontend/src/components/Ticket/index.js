import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import clsx from "clsx";
import { toast } from "react-toastify";

import { Paper, makeStyles } from "@material-ui/core";

import { AuthContext } from "../../context/Auth/AuthContext";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInputCustom/";
import MessagesList from "../MessagesList";
import { TagsContainer } from "../TagsContainer";
import TicketActionButtons from "../TicketActionButtonsCustom";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import MessageSearch from "../MessageSearch";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    marginRight: -drawerWidth,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user } = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          const { data } = await api.get("/tickets/u/" + ticketId);
          const { queueId } = data;
          const { queues, profile } = user;

          const queueAllowed = queues.find((q) => q.id === queueId);
          if (queueAllowed === undefined && profile !== "admin") {
            toast.error("Acesso não permitido");
            history.push("/tickets");
            return;
          }

          setContact(data.contact);
          setTicket(data);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on("ready", () => socket.emit("joinChatBox", `${ticket.id}`));

    socket.on(`company-${companyId}-ticket`, (data) => {
      if (data.action === "update" && data.ticket.id === ticket.id) {
        setTicket(data.ticket);
      }

      if (data.action === "delete" && data.ticketId === ticket.id) {
        // toast.success("Ticket deleted sucessfully.");
        history.push("/tickets");
      }
    });

    socket.on(`company-${companyId}-contact`, (data) => {
      if (data.action === "update") {
        setContact((prevState) => {
          if (prevState.id === data.contact?.id) {
            return { ...prevState, ...data.contact };
          }
          return prevState;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [ticketId, ticket, history, socketManager]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
  };

  const handleMessageFound = (message) => {
    // Scroll to the found message
    const messageElement = document.getElementById(`message-${message.id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message temporarily
      messageElement.classList.add('highlighted-message');
      setTimeout(() => {
        messageElement.classList.remove('highlighted-message');
      }, 3000);
    }
  };

  const handleNavigateResult = (message, index) => {
    handleMessageFound(message);
  };

  const renderTicketInfo = () => {
    if (ticket.user !== undefined) {
      return (
        <TicketInfo
          contact={contact}
          ticket={ticket}
          onClick={handleDrawerOpen}
        />
      );
    }
  };

  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          ticket={ticket}
          ticketId={ticket.id}
          isGroup={ticket.isGroup}
          onMessagesLoad={setMessages}
        ></MessagesList>
        <MessageInput ticketId={ticket.id} ticketStatus={ticket.status} />
      </>
    );
  };

  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
      >
        <TicketHeader loading={loading}>
          {renderTicketInfo()}
          <TicketActionButtons ticket={ticket} onSearchToggle={handleSearchToggle} />
        </TicketHeader>
        <Paper>
          <TagsContainer ticket={ticket} />
        </Paper>
        <MessageSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          messages={messages}
          onMessageFound={handleMessageFound}
          onNavigateResult={handleNavigateResult}
        />
        <ReplyMessageProvider>{renderMessagesList()}</ReplyMessageProvider>
      </Paper>
      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
      />
    </div>
  );
};

export default Ticket;