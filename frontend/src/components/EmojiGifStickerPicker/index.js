import React, { useState, useEffect, useRef } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Grid from "@material-ui/core/Grid";
import { CircularProgress, Tabs, Tab, TextField, InputAdornment } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import MoodIcon from "@material-ui/icons/Mood";
import { AuthContext } from "../../context/Auth/AuthContext";
import ConfirmationModal from "../ConfirmationModal";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import "./emoji-dark-mode.css";
import StickerPreview from "../StickerPreview";

const useStyles = makeStyles((theme) => ({
  pickerButton: {
    color: "grey",
  },
  pickerBox: {
    position: "absolute",
    bottom: 63,
    left: 0,
    width: "450px",
    maxHeight: "500px",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "8px",
    boxShadow: theme.shadows[5],
    zIndex: 1000,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  tabsContainer: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    minHeight: "48px",
    backgroundColor: theme.palette.background.default,
  },
  tabContent: {
    padding: "10px",
    overflowY: "auto",
    maxHeight: "450px",
    flex: 1,
    backgroundColor: theme.palette.background.paper,
  },
  stickerItem: {
    cursor: "pointer",
    padding: "5px",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  stickerImage: {
    width: "100%",
    height: "auto",
    maxWidth: "150px",
    maxHeight: "150px",
    objectFit: "contain",
  },
  gifItem: {
    cursor: "pointer",
    padding: "5px",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  gifImage: {
    width: "100%",
    height: "auto",
    maxWidth: "150px",
    maxHeight: "150px",
    objectFit: "contain",
  },
  emojiContainer: {
    display: "flex",
    justifyContent: "center",
  },
  searchInput: {
    marginBottom: "10px",
    marginTop: "10px",
  },
  emptyState: {
    padding: "20px",
    textAlign: "center",
    color: theme.palette.text.secondary,
  },
  deleteButton: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: "4px",
    backgroundColor: theme.palette.background.paper,
    zIndex: 10,
    minWidth: "24px",
    width: "24px",
    height: "24px",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const EmojiGifStickerPicker = ({ disabled, onSelectEmoji, onSelectGif, onSelectSticker }) => {
  const classes = useStyles();
  const theme = useTheme();
  const { user } = React.useContext(AuthContext);
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Emoji, 1: GIF, 2: Sticker
  const [stickers, setStickers] = useState([]);
  const [gifs, setGifs] = useState([]);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [gifSearchTerm, setGifSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [stickerToDelete, setStickerToDelete] = useState(null);
  const pickerBoxRef = useRef(null);

  useEffect(() => {
    if (showPicker && activeTab === 2) {
      loadStickers();
    }
  }, [showPicker, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerBoxRef.current &&
        !pickerBoxRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="emojiGifStickerPicker"]')
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPicker]);

  // Buscar GIFs usando Giphy API
  useEffect(() => {
    if (showPicker && activeTab === 1) {
      searchGifs(gifSearchTerm || "trending");
    }
  }, [activeTab, showPicker]);

  const loadStickers = async () => {
    setLoadingStickers(true);
    try {
      const { data } = await api.get("/stickers");
      setStickers(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoadingStickers(false);
    }
  };

  const searchGifs = async (searchTerm) => {
    setLoadingGifs(true);
    try {
      // Buscar a chave da API do Giphy das configurações
      let GIPHY_API_KEY = "";
      try {
        const { data: setting } = await api.get("/settings/giphyApiKey");
        if (setting && setting.value) {
          GIPHY_API_KEY = setting.value;
        }
      } catch (err) {
        console.error("Erro ao buscar chave do Giphy:", err);
      }
      
      // Fallback para .env se não encontrar nas settings
      if (!GIPHY_API_KEY) {
        GIPHY_API_KEY = process.env.REACT_APP_GIPHY_API_KEY || "";
      }
      
      if (!GIPHY_API_KEY || GIPHY_API_KEY === "YOUR_GIPHY_API_KEY") {
        setGifs([]);
        setLoadingGifs(false);
        return;
      }

      const endpoint = searchTerm === "trending" || !searchTerm
        ? `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=25`
        : `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=25`;

      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.data) {
        setGifs(data.data.map(gif => ({
          id: gif.id,
          url: gif.images.fixed_height.url,
          originalUrl: gif.images.original.url,
          title: gif.title || "GIF",
        })));
      } else {
        setGifs([]);
      }
    } catch (err) {
      console.error("Erro ao buscar GIFs:", err);
      setGifs([]);
    } finally {
      setLoadingGifs(false);
    }
  };

  const handleGifSearch = (event) => {
    const term = event.target.value;
    setGifSearchTerm(term);
    if (term.trim()) {
      const timeoutId = setTimeout(() => searchGifs(term), 500);
      return () => clearTimeout(timeoutId);
    } else {
      searchGifs("trending");
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (onSelectEmoji) {
      onSelectEmoji(emoji);
    }
    setShowPicker(false);
  };

  const handleGifSelect = async (gif) => {
    if (onSelectGif) {
      try {
        // Fazer download do GIF e enviar diretamente
        const response = await fetch(gif.originalUrl);
        const blob = await response.blob();
        const fileName = `gif_${gif.id}.gif`;
        const file = new File([blob], fileName, { type: "image/gif" });

        // Passar o arquivo para o handler
        onSelectGif({ file, url: gif.originalUrl });
      } catch (err) {
        toastError(err);
        // Fallback: enviar URL direto
        onSelectGif({ url: gif.originalUrl, isUrl: true });
      }
    }
    setShowPicker(false);
  };

  const handleStickerClick = (sticker) => {
    if (onSelectSticker) {
      onSelectSticker(sticker);
    }
    setShowPicker(false);
  };

  const handleDeleteSticker = (stickerId) => {
    setStickerToDelete(stickerId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSticker = async () => {
    if (!stickerToDelete) return;

    try {
      await api.delete(`/stickers/${stickerToDelete}`);
      await loadStickers();
    } catch (err) {
      toastError(err);
    } finally {
      setDeleteConfirmOpen(false);
      setStickerToDelete(null);
    }
  };

  const getStickerUrl = (sticker) => {
    if (!sticker || !sticker.path) {
      return '';
    }
    
    const baseURL = process.env.REACT_APP_BACKEND_URL || api.defaults.baseURL || '';
    const companyId = user?.companyId;
    
    if (!companyId) {
      return '';
    }
    
    // Path no banco sempre é: stickers/salvos/nome.ext
    // Se não começar com stickers/salvos/, normalizar
    let stickerPath = sticker.path;
    if (!stickerPath.startsWith('stickers/salvos/')) {
      const fileName = stickerPath.split('/').pop() || stickerPath;
      stickerPath = `stickers/salvos/${fileName}`;
    }
    
    // Construir URL completa
    const url = `${baseURL}/public/company${companyId}/${stickerPath}`;
    
    return url;
  };

  return (
    <>
      <IconButton
        aria-label="emojiGifStickerPicker"
        component="span"
        disabled={disabled}
        onClick={(e) => setShowPicker((prevState) => !prevState)}
      >
        <MoodIcon className={classes.pickerButton} />
      </IconButton>
      {showPicker && (
        <div ref={pickerBoxRef} className={classes.pickerBox}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            className={classes.tabsContainer}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="😀" />
            <Tab label="GIF" />
            <Tab label="📌" />
          </Tabs>
          <div className={classes.tabContent}>
            {activeTab === 0 && (
              <div className={classes.emojiContainer}>
                <Picker
                  perLine={16}
                  showPreview={false}
                  showSkinTones={false}
                  onSelect={handleEmojiSelect}
                  theme={theme.palette.type === "dark" ? "dark" : "light"}
                />
              </div>
            )}
            {activeTab === 1 && (
              <>
                <TextField
                  className={classes.searchInput}
                  fullWidth
                  placeholder="Buscar GIFs"
                  value={gifSearchTerm}
                  onChange={handleGifSearch}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                {loadingGifs ? (
                  <div className={classes.emptyState}>
                    <CircularProgress size={24} />
                  </div>
                ) : gifs.length === 0 ? (
                  <div className={classes.emptyState}>
                    Configure a chave da API do Giphy nas Configurações (apenas superadmin)
                  </div>
                ) : (
                  <Grid container spacing={1}>
                    {gifs.map((gif) => (
                      <Grid item xs={4} key={gif.id}>
                        <div
                          className={classes.gifItem}
                          onClick={() => handleGifSelect(gif)}
                        >
                          <img
                            src={gif.url}
                            alt={gif.title}
                            className={classes.gifImage}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
            {activeTab === 2 && (
              <>
                {loadingStickers ? (
                  <div className={classes.emptyState}>
                    <CircularProgress size={24} />
                  </div>
                ) : stickers.length === 0 ? (
                  <div className={classes.emptyState}>
                    Nenhum sticker salvo.
                  </div>
                ) : (
                  <Grid container spacing={1}>
                    {stickers.map((sticker) => {
                      const stickerUrl = getStickerUrl(sticker);
                      if (!stickerUrl) {
                        console.warn("URL do sticker vazia:", sticker);
                      }
                      return (
                        <Grid item xs={4} key={sticker.id}>
                          <div
                            className={classes.stickerItem}
                            style={{ position: "relative" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStickerClick(sticker);
                            }}
                          >
                            {stickerUrl ? (
                            <StickerPreview 
                              stickerUrl={stickerUrl} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStickerClick(sticker);
                              }}
                            />
                            ) : (
                              <div className={classes.emptyState} style={{ fontSize: "10px" }}>
                                URL inválida
                              </div>
                            )}
                            {stickerUrl && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSticker(sticker.id);
                                }}
                                className={classes.deleteButton}
                              >
                                <CloseIcon fontSize="small" style={{ fontSize: "16px" }} />
                              </IconButton>
                            )}
                          </div>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        title="Excluir Sticker"
        open={deleteConfirmOpen}
        onClose={setDeleteConfirmOpen}
        onConfirm={confirmDeleteSticker}
      >
        Deseja realmente excluir este sticker?
      </ConfirmationModal>
    </>
  );
};

export default EmojiGifStickerPicker;
