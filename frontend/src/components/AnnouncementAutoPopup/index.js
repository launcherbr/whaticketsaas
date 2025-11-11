import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  makeStyles
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import WarningIcon from "@material-ui/icons/Warning";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    textAlign: "center",
    maxWidth: 500,
    margin: "0 auto",
  },
  imageContainer: {
    margin: "0 auto 20px",
    textAlign: "center",
    maxWidth: "100%",
    maxHeight: 400,
    overflow: "hidden",
    borderRadius: theme.shape.borderRadius,
    border: "1px solid #f1f1f1",
  },
  image: {
    width: "100%",
    height: "auto",
    maxHeight: 400,
    objectFit: "contain",
    display: "block",
  },
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

const AnnouncementAutoPopup = ({ announcement, open, onClose }) => {
  const classes = useStyles();
  const [progress, setProgress] = useState(100);
  const AUTO_CLOSE_TIME = 10000; // 10 segundos
  const UPDATE_INTERVAL = 100; // Atualizar a cada 100ms

  useEffect(() => {
    if (open && announcement) {
      setProgress(100);
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (AUTO_CLOSE_TIME / UPDATE_INTERVAL));
          if (newProgress <= 0) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return newProgress;
        });
      }, UPDATE_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [open, announcement, onClose]);

  if (!announcement) return null;

  const borderPriority = (priority) => {
    if (priority === 1) return "#b81111";
    if (priority === 2) return "orange";
    if (priority === 3) return "grey";
    return "grey";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableBackdropClick
      disableEscapeKeyDown={false}
    >
      <Box className={classes.progressContainer}>
        <LinearProgress
          variant="determinate"
          value={progress}
          style={{
            height: 4,
            backgroundColor: "#f0f0f0",
          }}
        />
      </Box>
      <IconButton
        className={classes.closeButton}
        onClick={onClose}
        size="small"
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle
        style={{
          borderLeft: `4px solid ${borderPriority(announcement.priority)}`,
          paddingLeft: 16,
        }}
      >
        {announcement.title}
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        {announcement.mediaPath && (
          <Box className={classes.imageContainer}>
            <img
              alt="Announcement"
              src={announcement.mediaPath}
              className={classes.image}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </Box>
        )}
        <Typography variant="body1" color="textSecondary" style={{ whiteSpace: "pre-wrap" }}>
          {announcement.text}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="contained" fullWidth>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AnnouncementAutoPopup;


