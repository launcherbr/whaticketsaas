import React, { useState, useEffect, useReducer, useRef, useContext } from "react";
import { isSameDay, parseISO, format } from "date-fns";
import clsx from "clsx";
import { green } from "@material-ui/core/colors";
import {
  Button,
  CircularProgress,
  Divider,
  IconButton,
  makeStyles,
  Badge,
} from "@material-ui/core";
import {
  AccessTime,
  Block,
  Done,
  DoneAll,
  ExpandMore,
  GetApp,
  Reply,
  KeyboardArrowDown,
  InsertDriveFile,
  ArrowDownward,
} from "@material-ui/icons";
import AudioModal from "../AudioModal";
import AudioMessageWhatsApp from "../AudioMessageWhatsApp";
import MarkdownWrapper from "../MarkdownWrapper";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import LocationPreview from "../LocationPreview";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";
import VCardPreview from "../VCardPreview";
import StickerPreview from "../StickerPreview";
import GifPreview from "../GifPreview";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import SelectMessageCheckbox from "./SelectMessageCheckbox";

const useStyles = makeStyles((theme) => ({
  messagesListWrapper: {
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    width: "100%",
    minWidth: 300,
    minHeight: 200,
  },
  messagesList: {
    backgroundImage: theme.mode === 'light' ? `url(${whatsBackground})` : `url(${whatsBackgroundDark})`,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  circleLoading: {
    color: green[500],
    position: "absolute",
    opacity: "70%",
    top: 0,
    left: "50%",
    marginTop: 12,
  },
  relationContainer: {
    marginTop: -10,
    paddingTop: 5, 
    fontSize: "12px", 
    color: "#666", 
    display: "block", 
    textAlign: "left",
  },
  messageLeft: {
    marginRight: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: "#ffffff",
    color: "#303030",
    alignSelf: "flex-start",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },
  quotedContainerLeft: {
    margin: "-3px -80px 6px -6px",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },
  quotedMsg: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },
  quotedSideColorLeft: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },
  messageRight: {
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 600,
    height: "auto",
    display: "block",
    position: "relative",
    "&:hover #messageActionsButton": {
      display: "flex",
      position: "absolute",
      top: 0,
      right: 0,
    },
    whiteSpace: "pre-wrap",
    backgroundColor: "#dcf8c6",
    color: "#303030",
    alignSelf: "flex-end",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 0,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0,
    boxShadow: "0 1px 1px #b3b3b3",
  },
  messageSticker: {
    backgroundColor: "transparent !important",
    boxShadow: "none !important",
    padding: "0 !important",
  },
  quotedContainerRight: {
    margin: "-3px -80px 6px -6px",
    overflowY: "hidden",
    backgroundColor: "#cfe9ba",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },
  quotedMsgRight: {
    padding: 10,
    maxWidth: 300,
    height: "auto",
    whiteSpace: "pre-wrap",
  },
  quotedSideColorRight: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },
  messageActionsButton: {
    display: "none",
    position: "relative",
    color: "#999",
    zIndex: 1,
    backgroundColor: "inherit",
    opacity: "90%",
    "&:hover, &.Mui-focusVisible": { backgroundColor: "inherit" },
  },
  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },
  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },
  textContentItemEdited: {
    overflowWrap: "break-word",
    padding: "3px 120px 6px 6px",
    borderLeft: "3px solid #6bcbef",
  },
  textContentItemDeleted: {
    fontStyle: "italic",
    color: "rgba(0, 0, 0, 0.36)",
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },
  forwardMessage: {
    fontSize: 12,
    fontStyle: "italic",
    position: "absolute",
    top: 0,
    left: 5,
    color: "#999",
    display: "flex",
    alignItems: "center"
  },
  messageMedia: {
    objectFit: "cover",
    width: 250,
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999",
  },
  dailyTimestamp: {
    alignItems: "center",
    textAlign: "center",
    alignSelf: "center",
    width: "110px",
    backgroundColor: "#e1f3fb",
    margin: "10px",
    borderRadius: "10px",
    boxShadow: "0 1px 1px #b3b3b3",
  },
  dailyTimestampText: {
    color: "#808888",
    padding: 8,
    alignSelf: "center",
    marginLeft: "0px",
  },
  ackIcons: {
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },
  deletedIcon: {
    fontSize: 18,
    verticalAlign: "middle",
    marginRight: 4,
  },
  ackDoneAllIcon: {
    color: green[500],
    fontSize: 18,
    verticalAlign: "middle",
    marginLeft: 4,
  },
  downloadMedia: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "inherit",
    padding: 10,
    backgroundColor: theme.mode === 'light' ? '#2DDD7F' : '#1c1c1c',
    color: theme.mode === 'light' ? '#2DDD7F' : '#FFF',
  },
  documentContainer: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: theme.mode === 'light' ? '#dcf8c6' : '#2a2a2a',
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "default",
    "&:hover": {
      backgroundColor: theme.mode === 'light' ? '#d4f0c0' : '#333333',
    },
  },
  documentContainerReceived: {
    backgroundColor: theme.mode === 'light' ? '#ffffff' : '#2a2a2a',
    "&:hover": {
      backgroundColor: theme.mode === 'light' ? '#f5f5f5' : '#333333',
    },
  },
  documentIcon: {
    fontSize: 40,
    color: theme.mode === 'light' ? '#0084ff' : '#4fc3f7',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    fontSize: "14px",
    fontWeight: 500,
    color: theme.mode === 'light' ? '#111b21' : '#e9edef',
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  documentMeta: {
    fontSize: "12px",
    color: theme.mode === 'light' ? '#667781' : '#8696a0',
  },
  documentDownload: {
    marginLeft: 8,
    color: theme.mode === 'light' ? '#667781' : '#8696a0',
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative",
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": {
      color: theme.mode === 'light' ? '#0084ff' : '#4fc3f7',
    },
    "& svg": {
      transition: "opacity 0.3s ease",
    },
  },
  documentDownloadLoading: {
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      border: `2px solid ${theme.mode === 'light' ? '#0084ff' : '#4fc3f7'}`,
      borderTopColor: "transparent",
      animation: "$spin 0.8s linear infinite",
      zIndex: 1,
    },
    "& svg": {
      opacity: 0,
      visibility: "hidden",
    },
  },
  "@keyframes spin": {
    "0%": {
      transform: "rotate(0deg)",
    },
    "100%": {
      transform: "rotate(360deg)",
    },
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    zIndex: 1000,
    transition: "all 0.3s ease",
    opacity: 1,
    "&:hover": {
      backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#424242',
      transform: "scale(1.1)",
      boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
  },
  scrollToBottomButtonHidden: {
    opacity: 0,
    pointerEvents: "none",
    transform: "scale(0.8)",
    "&:hover": {
      opacity: 0, // Garante que não apareça no hover quando escondido
    },
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_MESSAGES") {
    const messages = action.payload;
    const newMessages = [];

    messages.forEach((message) => {
      const messageIndex = state.findIndex((m) => m.id === message.id);
      if (messageIndex !== -1) {
        state[messageIndex] = message;
      } else {
        newMessages.push(message);
      }
    });

    return [...newMessages, ...state];
  }

  if (action.type === "ADD_MESSAGE") {
    const newMessage = action.payload;
    const messageIndex = state.findIndex((m) => m.id === newMessage.id);

    if (messageIndex !== -1) {
      state[messageIndex] = newMessage;
    } else {
      state.push(newMessage);
    }

    return [...state];
  }

  if (action.type === "UPDATE_MESSAGE") {
    const messageToUpdate = action.payload;
    const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

    if (messageIndex !== -1) {
      if (messageToUpdate.isDeleted) {
        state[messageIndex] = {
          ...state[messageIndex],
          ...messageToUpdate
        };
      } else {
        state[messageIndex] = messageToUpdate;
      }
    }

    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const MessagesList = ({ ticket, ticketId, isGroup, onMessagesLoad }) => {
  const classes = useStyles();
  const [messagesList, dispatch] = useReducer(reducer, []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastMessageRef = useRef();
  const [selectedMessage, setSelectedMessage] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const messageOptionsMenuOpen = Boolean(anchorEl);
  const currentTicketId = useRef(ticketId);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesListRef = useRef();
  const socketManager = useContext(SocketContext);
  const scrollTimeoutRef = useRef();
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const { showSelectMessageCheckbox } = useContext(ForwardMessageContext);
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
    currentTicketId.current = ticketId;
  }, [ticketId]);

  useEffect(() => {
    if (onMessagesLoad && messagesList.length > 0) {
      onMessagesLoad(messagesList);
    }
  }, [messagesList, onMessagesLoad]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchMessages = async () => {
        if (ticketId === undefined) return;
        try {
          const { data } = await api.get("/messages/" + ticketId, {
            params: { pageNumber },
          });

          if (currentTicketId.current === ticketId) {
            dispatch({ type: "LOAD_MESSAGES", payload: data.messages });
            setHasMore(data.hasMore);
            setLoading(false);
          }

          if (pageNumber === 1 && data.messages.length > 1) {
            scrollToBottom();
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };
      fetchMessages();
    }, 500);
    return () => {
      clearTimeout(delayDebounceFn);
    };
  }, [pageNumber, ticketId]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on("ready", () => socket.emit("joinChatBox", `${ticket.id}`));

    socket.on(`company-${companyId}-appMessage`, (data) => {
      if (data.action === "create" && data.message.ticketId === currentTicketId.current) {
        dispatch({ type: "ADD_MESSAGE", payload: data.message });
        scrollToBottom();
      }

      if (data.action === "update" && data.message.ticketId === currentTicketId.current) {
        if (data.message.isEdited) {
          dispatch({ 
            type: "UPDATE_MESSAGE", 
            payload: {
              ...data.message,
              body: data.message.body || "Mensagem editada"
            }
          });
        } else {
          dispatch({ type: "UPDATE_MESSAGE", payload: data.message });
        }
      }
    });

    return () => {
      socket.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [ticketId, ticket, socketManager]);

  const loadMore = () => {
    const messagesContainer = document.getElementById("messagesList");
    const scrollHeightBefore = messagesContainer?.scrollHeight || 0;
    
    setPageNumber((prevPageNumber) => {
      // Preserva a posição do scroll após carregar novas mensagens
      setTimeout(() => {
        if (messagesContainer) {
          const scrollHeightAfter = messagesContainer.scrollHeight;
          const scrollDiff = scrollHeightAfter - scrollHeightBefore;
          messagesContainer.scrollTop += scrollDiff;
        }
      }, 100);
      
      return prevPageNumber + 1;
    });
  };

  const scrollToBottom = () => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({});
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Debounce para evitar múltiplas chamadas
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Lógica para carregar mais mensagens antigas quando rolar para cima
      if (hasMore && !loading && scrollTop < 100) {
        console.log("Carregando mais mensagens antigas...", { hasMore, loading, scrollTop });
        loadMore();
      }
    }, 100);

    // Lógica para mostrar/esconder botão de scroll to bottom (sem debounce para ser mais responsivo)
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  };

  const hanldeReplyMessage = (e, message) => {
    setAnchorEl(null);
    setReplyingMessage(message);
  };

  const handleOpenMessageOptionsMenu = (e, message) => {
    setAnchorEl(e.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMessageOptionsMenu = (e) => {
    setAnchorEl(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownloadDocument = async (message, event) => {
    event.stopPropagation();
    if (!message.mediaUrl) return;

    const messageId = message.id;
    setDownloadingFiles(prev => new Set(prev).add(messageId));

    try {
      // Normalizar URL se necessário
      let downloadUrl = message.mediaUrl;
      if (downloadUrl.startsWith('/')) {
        const baseURL = process.env.REACT_APP_BACKEND_URL || api.defaults.baseURL || 'http://localhost:3000';
        downloadUrl = `${baseURL}${downloadUrl}`;
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo');
      }

      const blob = await response.blob();
      const fileName = getFileName(message);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toastError(error);
    } finally {
      setTimeout(() => {
        setDownloadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }, 500);
    }
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  };

  const getFileName = (message) => {
    // Tenta extrair do dataJson primeiro (mensagens do Baileys)
    if (message.dataJson) {
      try {
        const data = JSON.parse(message.dataJson);
        const docMsg = data?.message?.documentMessage || 
                      data?.message?.documentWithCaptionMessage?.message?.documentMessage;
        if (docMsg?.fileName) {
          return docMsg.fileName;
        }
      } catch (e) {
        // Ignora erro de parsing
      }
    }
    
    if (message.body) {
      // Tenta extrair o nome do arquivo do body
      const lines = message.body.split('\n');
      for (let line of lines) {
        if (line.includes('.') && !line.startsWith('http') && !line.match(/^\d+\s*(B|KB|MB|GB)/i)) {
          return line.trim();
        }
      }
    }
    // Se não encontrar no body, tenta do mediaUrl
    if (message.mediaUrl) {
      const urlParts = message.mediaUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName && fileName.includes('.')) {
        // Remove timestamp se presente (formato: timestamp_filename.ext)
        const parts = fileName.split('_');
        if (parts.length > 1 && /^\d+$/.test(parts[0])) {
          return parts.slice(1).join('_');
        }
        return fileName;
      }
    }
    return 'Documento';
  };

  const checkMessageMedia = (message) => {
    if (message.mediaType === "locationMessage" && message.body.split('|').length >= 2) {
      let locationParts = message.body.split('|')
      let imageLocation = locationParts[0]
      let linkLocation = locationParts[1]
  
      let descriptionLocation = null
  
      if (locationParts.length > 2)
        descriptionLocation = message.body.split('|')[2]
  
      return <LocationPreview image={imageLocation} link={linkLocation} description={descriptionLocation} />
    } else if (message.mediaType === "contactMessage") {
      let array = message.body.split("\n");
      let obj = [];
      let contact = "";
      for (let index = 0; index < array.length; index++) {
        const v = array[index];
        let values = v.split(":");
        for (let ind = 0; ind < values.length; ind++) {
          if (values[ind].indexOf("+") !== -1) {
            obj.push({ number: values[ind] });
          }
          if (values[ind].indexOf("FN") !== -1) {
            contact = values[ind + 1];
          }
        }
      }
      return <VCardPreview contact={contact} numbers={obj[0].number} />
    } else if (message.mediaType === "sticker") {
      return <StickerPreview stickerUrl={message.mediaUrl} />;
    } else if (message.mediaType === "gif") {
      return <GifPreview gifUrl={message.mediaUrl} />;
    } else if (message.mediaType === "image") {
      return <ModalImageCors imageUrl={message.mediaUrl} />;
    } else if (message.mediaType === "audio") {
      return <AudioMessageWhatsApp url={message.mediaUrl} contact={!message.fromMe ? message.contact : null} fromMe={message.fromMe} />;
    } else if (message.mediaType === "video") {
      return (
        <video
          className={classes.messageMedia}
          src={message.mediaUrl}
          controls
        />
      );
    } else if (message.mediaType === "document" || message.mediaType === "application" || message.mediaType === "documentMessage" || message.mediaType === "documentWithCaptionMessage") {
      const fileName = getFileName(message);
      const fileExt = getFileExtension(fileName);
      
      // Tenta obter tamanho do arquivo do dataJson
      let fileSize = '';
      if (message.dataJson) {
        try {
          const data = JSON.parse(message.dataJson);
          const docMsg = data?.message?.documentMessage || 
                        data?.message?.documentWithCaptionMessage?.message?.documentMessage;
          if (docMsg?.fileLength) {
            fileSize = formatFileSize(docMsg.fileLength);
          }
        } catch (e) {
          // Ignora erro de parsing
        }
      }
      
      // Se não encontrou no dataJson, tenta do body
      if (!fileSize && message.body) {
        const fileSizeMatch = message.body?.match(/(\d+)\s*(B|KB|MB|GB)/i);
        fileSize = fileSizeMatch ? fileSizeMatch[0] : '';
      }
      
      const isDownloading = downloadingFiles.has(message.id);
      
      return (
        <div 
          className={`${classes.documentContainer} ${!message.fromMe ? classes.documentContainerReceived : ''}`}
        >
          <InsertDriveFile className={classes.documentIcon} />
          <div className={classes.documentInfo}>
            <div className={classes.documentName}>
              {fileName.length > 50 ? fileName.substring(0, 50) + '...' : fileName}
            </div>
            <div className={classes.documentMeta}>
              {fileExt ? `${fileExt} • ` : ''}{fileSize || 'Arquivo'}
            </div>
          </div>
          <div 
            className={`${classes.documentDownload} ${isDownloading ? classes.documentDownloadLoading : ''}`}
            onClick={(e) => handleDownloadDocument(message, e)}
          >
            <ArrowDownward style={{ fontSize: 20 }} />
          </div>
        </div>
      );
    } else {
      return (
        <>
          <div className={classes.downloadMedia}>
            <Button
              startIcon={<GetApp />}
              variant="outlined"
              target="_blank"
              href={message.mediaUrl}
            >
              Download
            </Button>
          </div>
          <Divider />
        </>
      );
    }
  };

  const renderMessageAck = (message) => {
    if (message.ack === 0) {
      return <AccessTime fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 1) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 2) {
      return <Done fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 3) {
      return <DoneAll fontSize="small" className={classes.ackIcons} />;
    }
    if (message.ack === 4 || message.ack === 5) {
      return <DoneAll fontSize="small" className={classes.ackDoneAllIcon} style={{color:'#0377FC'}} />;
    }
  };

  const renderDailyTimestamps = (message, index) => {
    if (index === 0) {
      return (
        <span
          className={classes.dailyTimestamp}
          key={`timestamp-${message.id}`}
        >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
      );
    }
    if (index < messagesList.length - 1) {
      let messageDay = parseISO(messagesList[index].createdAt);
      let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

      if (!isSameDay(messageDay, previousMessageDay)) {
        return (
          <span
            className={classes.dailyTimestamp}
            key={`timestamp-${message.id}`}
          >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
        );
      }
    }
    if (index === messagesList.length - 1) {
      return (
        <div
          key={`ref-${message.createdAt}`}
          ref={lastMessageRef}
          style={{ float: "left", clear: "both" }}
        />
      );
    }
  };

  const renderNumberTicket = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageTicket = message.ticketId;
      let connectionName = message.ticket?.whatsapp?.name;
      let previousMessageTicket = messagesList[index - 1].ticketId;

      if (messageTicket !== previousMessageTicket) {
        return (
          <center>
            <div className={classes.ticketNunberClosed}>
              Conversa encerrada: {format(parseISO(messagesList[index - 1].createdAt), "dd/MM/yyyy HH:mm:ss")}
            </div>

            <div className={classes.ticketNunberOpen}>
              Conversa iniciada: {format(parseISO(message.createdAt), "dd/MM/yyyy HH:mm:ss")}
            </div>
          </center>
        );
      }
    }
  };

  const renderMessageDivider = (message, index) => {
    if (index < messagesList.length && index > 0) {
      let messageUser = messagesList[index].fromMe;
      let previousMessageUser = messagesList[index - 1].fromMe;

      if (messageUser !== previousMessageUser) {
        return (
          <span style={{ marginTop: 16 }} key={`divider-${message.id}`}></span>
        );
      }
    }
  };

  const renderQuotedMessage = (message) => {
    return (
      <div
        className={clsx(classes.quotedContainerLeft, {
          [classes.quotedContainerRight]: message.fromMe,
        })}
      >
        <span
          className={clsx(classes.quotedSideColorLeft, {
            [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
          })}
        ></span>
        <div className={classes.quotedMsg}>
          {!message.quotedMsg?.fromMe && (
            <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
          )}

          {message.quotedMsg.mediaType === "audio"
            && (
              <div className={classes.downloadMedia}>
                <audio controls>
                  <source src={message.quotedMsg.mediaUrl} type="audio/ogg"></source>
                </audio>
              </div>
            )
          }
          {message.quotedMsg.mediaType === "video"
            && (
              <video
                className={classes.messageMedia}
                src={message.quotedMsg.mediaUrl}
                controls
              />
            )
          }
          {message.quotedMsg.mediaType === "application"
            && (
<div className={classes.downloadMedia}>
  <Button 
    startIcon={<GetApp />}
    variant="outlined"
    href={message.quotedMsg.mediaUrl}
    target="_blank"
    sx={(theme) => ({
      borderColor: theme.palette.mode === 'light' ? '#2DDD7F' : '#FFF',
      color: theme.palette.mode === 'light' ? '#2DDD7F' : '#FFF',
      backgroundColor: theme.palette.mode === 'light' ? '#2DDD7F10' : '#1c1c1c',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'light' ? '#2DDD7F20' : '#333',
        borderColor: theme.palette.mode === 'light' ? '#2DDD7F' : '#FFF',
        color: theme.palette.mode === 'light' ? '#2DDD7F' : '#FFF',
      }
    })}
  >
    Download
  </Button>
</div>

            )
          }

          {message.quotedMsg.mediaType === "gif" && (
            <GifPreview gifUrl={message.quotedMsg.mediaUrl} />
          )}
          {message.quotedMsg.mediaType === "sticker" && (
            <StickerPreview stickerUrl={message.quotedMsg.mediaUrl} />
          )}
          {message.quotedMsg.mediaType === "image"
            && (
              <ModalImageCors imageUrl={message.quotedMsg.mediaUrl} />)
            }
          {!message.quotedMsg.mediaType || 
           (message.quotedMsg.mediaType !== "audio" && 
            message.quotedMsg.mediaType !== "video" && 
            message.quotedMsg.mediaType !== "application" && 
            message.quotedMsg.mediaType !== "image" && 
            message.quotedMsg.mediaType !== "gif" && 
            message.quotedMsg.mediaType !== "sticker" &&
            message.quotedMsg?.body)}

        </div>
      </div>
    );
  };

  const renderMessages = () => {
    if (messagesList.length > 0) {
      const viewMessagesList = messagesList.map((message, index) => {
        if (message.mediaType === "call_log") {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderNumberTicket(message, index)}
              {renderMessageDivider(message, index)}
              <div className={classes.messageCenter}>
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 17" width="20" height="17">
                    <path fill="#df3333" d="M18.2 12.1c-1.5-1.8-5-2.7-8.2-2.7s-6.7 1-8.2 2.7c-.7.8-.3 2.3.2 2.8.2.2.3.3.5.3 1.4 0 3.6-.7 3.6-.7.5-.2.8-.5.8-1v-1.3c.7-1.2 5.4-1.2 6.4-.1l.1.1v1.3c0 .2.1.4.2.6.1.2.3.3.5.4 0 0 2.2.7 3.6.7.2 0 1.4-2 .5-3.1zM5.4 3.2l4.7 4.6 5.8-5.7-.9-.8L10.1 6 6.4 2.3h2.5V1H4.1v4.8h1.3V3.2z"></path>
                  </svg> <span>Chamada de voz/vídeo perdida às {format(parseISO(message.createdAt), "HH:mm")}</span>
                </div>
              </div>
            </React.Fragment>
          );
        }

        if (!message.fromMe) {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderNumberTicket(message, index)}
              {renderMessageDivider(message, index)}
              <div
                id={`message-${message.id}`}
                className={clsx(classes.messageLeft, {
                  [classes.messageSticker]: message.mediaType === "sticker"
                })}
                title={message.queueId && message.queue?.name}
                onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              >
                {showSelectMessageCheckbox && (
                  <SelectMessageCheckbox
                    message={message}
                  />
                )}
                
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {message.isForwarded && (
                  <div>
                    <span className={classes.forwardMessage}
                    ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                    </span>
                    <br />
                  </div>
                )}
                {isGroup && (
                  <span className={classes.messageContactName}>
                    {message.contact?.name}
                  </span>
                )}

                {message.isDeleted && (
                  <div>
                    <span className={"message-deleted"}
                    >Essa mensagem foi apagada pelo contato &nbsp;
                      <Block
                        color="error"
                        fontSize="small"
                        className={classes.deletedIcon}
                      />
                    </span>
                  </div>
                )}

                {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "vcard" || message.mediaType === "contactMessage" || message.mediaType === "document" || message.mediaType === "application" || message.mediaType === "documentMessage" || message.mediaType === "documentWithCaptionMessage"
                ) && checkMessageMedia(message)}
                <div className={message.isEdited ? classes.textContentItemEdited : classes.textContentItem}>
                  {message.quotedMsg && renderQuotedMessage(message)}
                  {message.mediaType !== "reactionMessage" && message.mediaType !== "audio" && message.mediaType !== "document" && message.mediaType !== "application" && message.mediaType !== "documentMessage" && message.mediaType !== "documentWithCaptionMessage" && message.mediaType !== "sticker" && message.mediaType !== "image" && message.mediaType !== "video" && message.mediaType !== "gif" && (
                    <MarkdownWrapper>
                      {message.mediaType === "locationMessage" || message.mediaType === "contactMessage"
                        ? null
                        : message.body}
                    </MarkdownWrapper>
                  )}
                  {message.quotedMsg && message.mediaType === "reactionMessage" && (
                    <>
                      <span style={{ marginLeft: "0px" }}>
                        <MarkdownWrapper>
                          {"" + message?.contact?.name + " reagiu... " + message.body}
                        </MarkdownWrapper>
                      </span>
                    </>
                  )}
                                  
                  <span className={classes.timestamp}>
                    {message.isEdited ? "Editada " + format(parseISO(message.updatedAt || message.createdAt), "HH:mm") : format(parseISO(message.createdAt), "HH:mm")}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        } else {
          return (
            <React.Fragment key={message.id}>
              {renderDailyTimestamps(message, index)}
              {renderNumberTicket(message, index)}
              {renderMessageDivider(message, index)}
              <div 
                id={`message-${message.id}`}
                className={clsx(classes.messageRight, {
                  [classes.messageSticker]: message.mediaType === "sticker"
                })}
                onDoubleClick={(e) => hanldeReplyMessage(e, message)}
              >
              {showSelectMessageCheckbox && (
                <SelectMessageCheckbox
                  message={message}
                />
              )}
              
                <IconButton
                  variant="contained"
                  size="small"
                  id="messageActionsButton"
                  disabled={message.isDeleted}
                  className={classes.messageActionsButton}
                  onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                >
                  <ExpandMore />
                </IconButton>
                {message.isForwarded && (
                  <div>
                    <span className={classes.forwardMessage}
                    ><Reply style={{ color: "grey", transform: 'scaleX(-1)' }} /> Encaminhada
                    </span>
                    <br />
                  </div>
                )}
                {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === "vcard" || message.mediaType === "contactMessage" || message.mediaType === "document" || message.mediaType === "application" || message.mediaType === "documentMessage" || message.mediaType === "documentWithCaptionMessage" || message.mediaType === "sticker" || message.mediaType === "gif" || message.mediaType === "image" || message.mediaType === "video" || message.mediaType === "audio"
                ) && checkMessageMedia(message)}
                <div
                  className={clsx({
                    [classes.textContentItem]: !message.isEdited && !message.isDeleted,
                    [classes.textContentItemEdited]: message.isEdited,
                    [classes.textContentItemDeleted]: message.isDeleted,
                  })}
                >
                  {message.isDeleted && (
                    <Block
                      color="disabled"
                      fontSize="small"
                      className={classes.deletedIcon}
                    />
                  )}
                  {message.quotedMsg && renderQuotedMessage(message)}
                  {message.mediaType !== "reactionMessage" && message.mediaType !== "locationMessage" && message.mediaType !== "contactMessage" && message.mediaType !== "audio" && message.mediaType !== "document" && message.mediaType !== "application" && message.mediaType !== "documentMessage" && message.mediaType !== "documentWithCaptionMessage" && message.mediaType !== "sticker" && message.mediaType !== "image" && message.mediaType !== "video" && message.mediaType !== "gif" && (
                    <MarkdownWrapper>{message.body}</MarkdownWrapper>
                  )}
                  {message.quotedMsg && message.mediaType === "reactionMessage" && (
                    <>
                      <span style={{ marginLeft: "0px" }}>
                        <MarkdownWrapper>
                          {"Você reagiu... " + message.body}
                        </MarkdownWrapper>
                      </span>
                    </>
                  )}
                          
                  <span className={classes.timestamp}>
                    {message.isEdited ? "Editada " + format(parseISO(message.updatedAt || message.createdAt), "HH:mm") : format(parseISO(message.createdAt), "HH:mm")}
                    {renderMessageAck(message)}
                  </span>
                </div>
              </div>
            </React.Fragment>
          );
        }
      });
      return viewMessagesList;
    } else {
      return <div>Diga olá para seu novo contato!</div>;
    }
  };

  return (
    <div className={classes.messagesListWrapper}>
      <MessageOptionsMenu
        message={selectedMessage}
        anchorEl={anchorEl}
        menuOpen={messageOptionsMenuOpen}
        handleClose={handleCloseMessageOptionsMenu}
      />
      <div
        id="messagesList"
        className={classes.messagesList}
        onScroll={handleScroll}
        ref={messagesListRef}
      >
        {messagesList.length > 0 ? renderMessages() : []}
      </div>
      {loading && (
        <div>
          <CircularProgress className={classes.circleLoading} />
        </div>
      )}
      
      {/* Botão de scroll para última mensagem */}
      <IconButton
        className={clsx(classes.scrollToBottomButton, {
          [classes.scrollToBottomButtonHidden]: !showScrollToBottom
        })}
        onClick={scrollToBottom}
        title="Ir para última mensagem"
      >
        <KeyboardArrowDown />
      </IconButton>
    </div>
  );
};

export default MessagesList;
