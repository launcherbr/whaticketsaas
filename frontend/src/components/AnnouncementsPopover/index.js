import React, { useEffect, useReducer, useState, useContext, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import toastError from "../../errors/toastError";
import Popover from "@material-ui/core/Popover";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import Notifications from "@material-ui/icons/Notifications"

import {
  Avatar,
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  Paper,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from "@material-ui/core";
import api from "../../services/api";
import { isArray } from "lodash";
import moment from "moment";
import { SocketContext } from "../../context/Socket/SocketContext";
import AnnouncementAutoPopup from "../AnnouncementAutoPopup";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    maxHeight: 3000,
    maxWidth: 5000,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

function AnnouncementDialog({ announcement, open, handleClose }) {
  return (
    <Dialog
      open={open}
      onClose={() => handleClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="alert-dialog-title">{announcement.title}</DialogTitle>
      <DialogContent>
        {announcement.mediaPath && (
          <div
            style={{
              border: "1px solid #f1f1f1",
              margin: "0 auto 20px",
              textAlign: "center",
              maxWidth: "100%",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <img
              alt="Announcement"
              src={announcement.mediaPath}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 400,
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}
        <DialogContentText id="alert-dialog-description" style={{ whiteSpace: "pre-wrap" }}>
          {announcement.text}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose()} color="primary" autoFocus>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_ANNOUNCEMENTS") {
    const announcements = action.payload;
    const newAnnouncements = [];

    if (isArray(announcements)) {
      announcements.forEach((announcement) => {
        const announcementIndex = state.findIndex(
          (u) => u.id === announcement.id
        );
        if (announcementIndex !== -1) {
          state[announcementIndex] = announcement;
        } else {
          newAnnouncements.push(announcement);
        }
      });
    }

    return [...state, ...newAnnouncements];
  }

  if (action.type === "UPDATE_ANNOUNCEMENTS") {
    const announcement = action.payload;
    const announcementIndex = state.findIndex((u) => u.id === announcement.id);

    if (announcementIndex !== -1) {
      state[announcementIndex] = announcement;
      return [...state];
    } else {
      return [announcement, ...state];
    }
  }

  if (action.type === "DELETE_ANNOUNCEMENT") {
    const announcementId = action.payload;

    const announcementIndex = state.findIndex((u) => u.id === announcementId);
    if (announcementIndex !== -1) {
      state.splice(announcementIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

export default function AnnouncementsPopover() {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchParam] = useState("");
  const [announcements, dispatch] = useReducer(reducer, []);
  const [invisible, setInvisible] = useState(false);
  const [announcement, setAnnouncement] = useState({});
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [showAutoPopup, setShowAutoPopup] = useState(false);
  const [autoPopupAnnouncement, setAutoPopupAnnouncement] = useState(null);
  const shownAnnouncementsRef = useRef(new Set());

  const socketManager = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchAnnouncements();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);
    
    if (!socket) {
      return () => {}; 
    }

    socket.on(`company-announcement`, (data) => {
      if (user?.super && data.record && data.record.showForSuperAdmin === false) {
        return;
      }
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_ANNOUNCEMENTS", payload: data.record });
        setInvisible(false);
        
        // Mostrar popup automático para novos anúncios
        if (data.action === "create" && data.record.status) {
          // Verificar se já mostramos este anúncio
          const announcementId = data.record.id;
          if (!shownAnnouncementsRef.current.has(announcementId)) {
            shownAnnouncementsRef.current.add(announcementId);
            setAutoPopupAnnouncement(data.record);
            setShowAutoPopup(true);
          }
        }
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_ANNOUNCEMENT", payload: +data.id });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get("/announcements/", {
        params: { searchParam, pageNumber },
      });
      const filteredRecords = (data.records || []).filter((item) => {
        if (user?.super && item.showForSuperAdmin === false) {
          return false;
        }
        return true;
      });
      dispatch({ type: "LOAD_ANNOUNCEMENTS", payload: filteredRecords });
      setHasMore(Boolean(data.hasMore) || filteredRecords.length < (data.records || []).length);
      setLoading(false);
      
      // Mostrar popup automático para o anúncio mais recente se ainda não foi mostrado
      if (filteredRecords && filteredRecords.length > 0 && pageNumber === 1) {
        const latestAnnouncement = filteredRecords[0];
        const announcementId = latestAnnouncement.id;
        
        if (
          latestAnnouncement.status &&
          !shownAnnouncementsRef.current.has(announcementId) &&
          latestAnnouncement.createdAt &&
          moment().diff(moment(latestAnnouncement.createdAt), "minutes") < 5 // Apenas anúncios criados nos últimos 5 minutos
        ) {
          shownAnnouncementsRef.current.add(announcementId);
          setAutoPopupAnnouncement(latestAnnouncement);
          setShowAutoPopup(true);
        }
      }
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setInvisible(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const borderPriority = (priority) => {
    if (priority === 1) {
      return "4px solid #b81111";
    }
    if (priority === 2) {
      return "4px solid orange";
    }
    if (priority === 3) {
      return "4px solid grey";
    }
  };

  {/* const getMediaPath = (filename) => {
    return `${process.env.REACT_APP_BACKEND_URL}/public/${filename}`;
  };*/}

  const handleShowAnnouncementDialog = (record) => {
    setAnnouncement(record);
    setShowAnnouncementDialog(true);
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  return (
    <div>
      <AnnouncementAutoPopup
        announcement={autoPopupAnnouncement}
        open={showAutoPopup}
        onClose={() => {
          setShowAutoPopup(false);
          setAutoPopupAnnouncement(null);
        }}
      />
      <AnnouncementDialog
        announcement={announcement}
        open={showAnnouncementDialog}
        handleClose={() => setShowAnnouncementDialog(false)}
      />
      <IconButton
        variant="contained"
        aria-describedby={id}
        onClick={handleClick}
        style={{ color: "white" }}
      >
        <Badge
          color="secondary"
          variant="dot"
          invisible={invisible || announcements.length < 1}
        >
          <Notifications />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Paper
          variant="outlined"
          onScroll={handleScroll}
          className={classes.mainPaper}
        >
          <List
            component="nav"
            aria-label="main mailbox folders"
            style={{ minWidth: 300 }}
          >
            {isArray(announcements) &&
              announcements.map((item, key) => (
                <ListItem
                  key={key}
                  style={{
                    //background: key % 2 === 0 ? "#ededed" : "white",
                    border: "1px solid #eee",
                    borderLeft: borderPriority(item.priority),
                    cursor: "pointer",
                  }}
                  onClick={() => handleShowAnnouncementDialog(item)}
                >
                  {item.mediaPath && (
                    <ListItemAvatar>
                      <Avatar
                        src={item.mediaPath}
                        variant="rounded"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                        }}
                        imgProps={{
                          style: {
                            objectFit: "cover",
                          },
                          onError: (e) => {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        <Typography component="span" style={{ fontSize: 12 }}>
                          {moment(item.createdAt).format("DD/MM/YYYY")}
                        </Typography>
                        <span style={{ marginTop: 5, display: "block" }}></span>
                        <Typography component="span" variant="body2">
                          {item.text}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            {isArray(announcements) && announcements.length === 0 && (
              <ListItemText primary="Nenhum registro" />
            )}
          </List>
        </Paper>
      </Popover>
    </div>
  );
}
