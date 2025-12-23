import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  makeStyles,
  IconButton,
  Box,
  Typography,
} from "@material-ui/core";
import { Send, Close, Image as ImageIcon, Videocam, Description } from "@material-ui/icons";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  dialog: {
    minWidth: 400,
  },
  mediaPreview: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  mediaThumbnail: {
    width: "100%",
    maxHeight: 200,
    objectFit: "contain",
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  mediaContainer: {
    position: "relative",
    display: "inline-block",
    width: "100%",
  },
  mediaIcon: {
    fontSize: 48,
    color: theme.palette.text.secondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  fileName: {
    marginTop: theme.spacing(1),
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
}));

const QuickMessageEditModal = ({ open, onClose, quickMessage, ticketId, onSend, replyingMessage }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [editedMessage, setEditedMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [mediaLoadError, setMediaLoadError] = useState(false);
  const [signMessage, setSignMessage] = useState(() => {
    const stored = localStorage.getItem("signOption");
    return stored !== null ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    if (quickMessage && open) {
      setEditedMessage(quickMessage.message || "");
      setMediaFile(null);
      setMediaPreviewUrl(null);
      setMediaLoadError(false);
      
      // Carrega mídia se houver
      if (quickMessage.mediaPath) {
        loadMedia(quickMessage.mediaPath);
      }
    }
  }, [quickMessage, open]);

  const loadMedia = async (mediaPath) => {
    if (!mediaPath) {
      setLoadingMedia(false);
      return;
    }

    setLoadingMedia(true);
    setMediaLoadError(false);
    
    try {
      // Normaliza a URL da mídia
      let mediaUrl = mediaPath;
      
      // Se a URL for relativa, adiciona o baseURL
      if (mediaUrl.startsWith('/')) {
        const baseURL = process.env.REACT_APP_BACKEND_URL || api.defaults.baseURL || '';
        mediaUrl = `${baseURL}${mediaUrl}`;
      }
      
      // Remove duplicação de protocolo/porta se houver (ex: http://localhost:4250:8080)
      if (mediaUrl.match(/:\d+:\d+/)) {
        mediaUrl = mediaUrl.replace(/:(\d+):(\d+)/, ':$1');
      }
      
      // Extrai o nome do arquivo da URL antes de fazer a requisição
      const urlParts = mediaPath.split('/');
      let fileName = urlParts[urlParts.length - 1] || `media_${new Date().getTime()}`;
      fileName = fileName.split('?')[0];
      
      // Detecta o tipo MIME baseado na extensão
      const extension = fileName.split('.').pop()?.toLowerCase();
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        'txt': 'text/plain',
        'mp3': 'audio/mpeg',
        'ogg': 'audio/ogg',
        'wav': 'audio/wav',
      };
      const defaultMimeType = mimeTypes[extension] || 'application/octet-stream';
      
      let blob;
      let mimeType = defaultMimeType;
      
      try {
        // Tenta usar a API do sistema para garantir autenticação
        const response = await api.get(mediaUrl, {
          responseType: "blob",
        });
        
        blob = response.data;
        
        // Usa o tipo MIME do blob se disponível, senão usa o detectado pela extensão
        if (blob.type) {
          mimeType = blob.type;
        }
      } catch (apiErr) {
        // Se falhar com api.get, tenta usar fetch com token de autenticação
        console.warn('Erro ao carregar com api.get, tentando fetch:', apiErr);
        
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const fetchResponse = await fetch(mediaUrl, { headers });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        blob = await fetchResponse.blob();
        
        if (blob.type) {
          mimeType = blob.type;
        }
      }
      
      // Converte blob para File
      const file = new File([blob], fileName, { type: mimeType });
      setMediaFile(file);
      setMediaLoadError(false);
    } catch (err) {
      console.error('Erro ao carregar mídia:', err);
      console.error('URL tentada:', mediaPath);
      setMediaFile(null);
      setMediaLoadError(true);
      toastError(err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSend = async () => {
    if (!editedMessage.trim() && !mediaFile) {
      toast.error("Digite uma mensagem ou anexe uma mídia");
      return;
    }

    setLoading(true);
    try {
      // Aplica assinatura se estiver ativa
      const messageToSend = signMessage && editedMessage.trim()
        ? `*${user?.name}:*\n${editedMessage}`
        : editedMessage;

      if (mediaFile) {
        // Envia mídia com mensagem
        const formData = new FormData();
        formData.append("medias", mediaFile);
        formData.append("body", messageToSend || "");
        formData.append("fromMe", true);

        await api.post(`/messages/${ticketId}`, formData);
      } else {
        // Envia apenas texto
        await api.post(`/messages/${ticketId}`, {
          read: 1,
          fromMe: true,
          mediaUrl: "",
          body: messageToSend,
          quotedMsg: replyingMessage,
        });
      }

      if (onSend) {
        onSend();
      }
      handleClose();
      toast.success("Mensagem enviada com sucesso!");
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEditedMessage("");
    setMediaFile(null);
    onClose();
  };

  useEffect(() => {
    if (mediaFile) {
      const url = URL.createObjectURL(mediaFile);
      setMediaPreviewUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setMediaPreviewUrl(null);
    }
  }, [mediaFile]);

  const renderMediaPreview = () => {
    if (loadingMedia) {
      return (
        <Box className={classes.mediaPreview}>
          <Typography>Carregando mídia...</Typography>
        </Box>
      );
    }

    // Se houve erro ao carregar e há mediaPath, mostra mensagem de erro
    if (mediaLoadError && quickMessage?.mediaPath) {
      return (
        <Box className={classes.mediaPreview}>
          <Typography color="error" variant="body2">
            Não foi possível carregar a mídia. Verifique se o arquivo existe.
          </Typography>
        </Box>
      );
    }

    if (!mediaFile || !mediaPreviewUrl) return null;

    const isImage = mediaFile.type.startsWith('image/');
    const isVideo = mediaFile.type.startsWith('video/');

    return (
      <Box className={classes.mediaPreview}>
        <div className={classes.mediaContainer}>
          {isImage && (
            <img
              src={mediaPreviewUrl}
              alt={mediaFile.name}
              className={classes.mediaThumbnail}
            />
          )}
          {isVideo && (
            <video
              src={mediaPreviewUrl}
              className={classes.mediaThumbnail}
              controls
            />
          )}
          {!isImage && !isVideo && (
            <div className={classes.mediaIcon}>
              <Description fontSize="large" />
              <Typography className={classes.fileName} variant="body2">
                {mediaFile.name}
              </Typography>
            </div>
          )}
        </div>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className={classes.dialog}
    >
      <DialogTitle>
        Editar Resposta Rápida
        <IconButton
          aria-label="close"
          onClick={handleClose}
          style={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {renderMediaPreview()}
        <TextField
          autoFocus
          margin="dense"
          label="Mensagem"
          fullWidth
          multiline
          rows={4}
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button
          onClick={handleSend}
          color="primary"
          variant="contained"
          disabled={loading || (!editedMessage.trim() && !mediaFile)}
          startIcon={<Send />}
        >
          {loading ? "Enviando..." : "Enviar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickMessageEditModal;

