import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  InputBase
} from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import whatsBackground from "../../assets/wa-background.png";
import { makeStyles } from "@material-ui/core";
import MarkdownWrapper from "../MarkdownWrapper";
import MoodIcon from "@material-ui/icons/Mood";
import api from "../../services/api";
import whatsBackgroundDark from "../../assets/wa-background-dark.png"

const useStyles = makeStyles((theme) => ({
  messagesList: {
    backgroundSize: "370px",
    backgroundImage: theme.mode === 'light' ? `url(${whatsBackground})` : `url(${whatsBackgroundDark})`, //DARK MODE PLW DESIGN//
    display: "flex",
    display: "flex",
    justifyContent: "center",
    flexGrow: 1,
    padding: "20px 20px 20px 20px",
    overflowY: "scroll",
    "@media (max-width: 600px)": {
      paddingBottom: "90px"
    },
    ...theme.scrollbarStyles,
    minHeight: "150px",
    minWidth: "500px"
  },
  textContentItem: {
    overflowWrap: "break-word",
    padding: "3px 80px 6px 6px",
  },
  messageRight: {
    fontSize: "13px",
    marginLeft: 20,
    marginTop: 2,
    minWidth: 100,
    maxWidth: 510,
    height: "auto",
    display: "block",
    position: "relative",
    whiteSpace: "pre-wrap",
    alignSelf: "flex-end",
    borderRadius: 8,
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 5,
    paddingBottom: 0
  },
  inputmsg:{
	  backgroundColor: theme.mode === 'light' ? '#FFF' : '#1c1c1c',
	  display: "flex",
      width: "100%",
      margin: "10px 0px 10px 20px",
      borderRadius: "10px"
  },
  timestamp: {
    fontSize: 11,
    position: "absolute",
    bottom: 0,
    right: 5,
    color: "#999"
  },
  titleBackground: {
    color:'#ffff',
    backgroundColor: "#00796b"  , // Cor de fundo desejada
    marginLeft:'3px'
  },
  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
    zIndex:1
  },
}));

// const EmojiOptions = React.forwardRef((props, ref) => {
//   const { disabled, showEmoji, setShowEmoji, handleAddEmoji } = props;
//   const classes = useStyles();

//   return (
//     <>
//       <IconButton
//         aria-label="emojiPicker"
//         component="span"
//         disabled={disabled}
//         onClick={(e) => setShowEmoji((prevState) => !prevState)}
//       >
//         <MoodIcon className={classes.sendMessageIcons} />
//       </IconButton>

//       {showEmoji ? (
//         <div ref={ref} className={classes.emojiBox}>
//           <EmojiPicker
//             height={700}
//             width={400}
//           />
//         </div>
//       ) : null}
//     </>
//   );
// });

const EditMessageModal = ({ open, onClose, onSave, message }) => {
  const classes = useStyles();
  const [editedMessage, setEditedMessage] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const emojiOptionsRef = useRef(null);
  const modalRef = useRef(null);
  
  useEffect(() => {
    if (open) {
      setEditedMessage(message?.body);
    }
  }, [open, message]);

  const handleSave = async (editedMessage) => {
    if(editedMessage){
      try {
        const messages = {
          read: 1,
          fromMe: true,
          mediaUrl: "",
          body: editedMessage,
          quotedMsg: null,
        };
        await api.post(`/messages/edit/${message.id}`,messages)
        onClose(false)
      } catch (err) {
        
      }
    }
  };


  const setInputValue = (value) => {
    let emoji = value.native;
    setEditedMessage(editedMessage ? editedMessage + value.native : emoji);
  };

  useEffect(() => {
    if (open) {
      // Calculate the position for EmojiOptions inside the modal
      if (open && modalRef.current && emojiOptionsRef.current) {
      const modalRect = modalRef.current.getBoundingClientRect();
      const emojiOptionsRect = emojiOptionsRef.current.getBoundingClientRect();
      const desiredPosition = {
        top: emojiOptionsRect.height > modalRect.height
          ? 0
          : modalRect.height - emojiOptionsRect.height,
        left: modalRect.width - emojiOptionsRect.width
      };
      emojiOptionsRef.current.style.top = `${desiredPosition.top}px`;
      emojiOptionsRef.current.style.left = `${desiredPosition.left}px`;
    }
  };
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={() => onClose(false)}
      aria-labelledby="edit-message-dialog"
      PaperProps={{
        style: {
          zIndex: 1 // Defina um valor alto de zIndex para garantir que o modal sobreponha outros elementos
        },
      }}
      ref={modalRef}
    >
      <DialogTitle id="edit-message-dialog" className={classes.titleBackground}>
       <IconButton edge="start" color="inherit" onClick={() => onClose(false)} aria-label="close">
          <CloseIcon />
        </IconButton>
        Editar Mensagem
        </DialogTitle>
      <DialogContent style={{ padding: "0px"}}>
        <Box>
          <Box className={classes.messagesList} >
            <Box
              component="div"
              className={`${classes.messageRight}`}
              style={{
                fontStyle: "italic",
                backgroundColor: "#d9fdd3"
              }}
            >
              <Box className={classes.textContentItem}>
                <Box component="div" style={{ color:  "#212B36" }}>
                  <MarkdownWrapper>{message?.body}</MarkdownWrapper>
                </Box>
                {/* <span className={classes.timestamp}>
                  {format(parseISO(message?.updatedAt), "HH:mm")}
                </span> */}
              </Box>
            </Box>
          </Box>
          <Paper
		   
            component="form"
            style={{
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "0px",
              backgroundColor: "#f0f2f5"
            }}
          >
            <Box
			  className={`${classes.inputmsg}`}
            >
              <InputBase
                style={{ padding: "15px 0px 15px 15px", flex: 1 }}
                multiline
                maxRows={6}
                placeholder="Search Google Maps"
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                inputProps={{ "aria-label": "search google maps" }}
              />
            {/* <EmojiOptions
              ref={emojiOptionsRef}
              handleAddEmoji={setInputValue}
              showEmoji={showEmoji}
              setShowEmoji={setShowEmoji}
            /> */}
            </Box>
            <IconButton color="primary" aria-label="directions"  onClick={() => handleSave(editedMessage)}>
              <CheckCircleIcon
                style={{
                  width: "35px",
                  height: "35px",
                  color:'#00A884'
                }}
              />
            </IconButton>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default EditMessageModal;