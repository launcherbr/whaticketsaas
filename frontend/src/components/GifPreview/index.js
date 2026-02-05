import React, { useState, useRef, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  gifContainer: {
    position: "relative",
    display: "inline-block",
    maxWidth: "100%",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.95,
    },
  },
  gifImage: {
    maxWidth: "180px",
    maxHeight: "180px",
    width: "auto",
    height: "auto",
    display: "block",
    borderRadius: "4px",
    objectFit: "contain",
  },
  gifLabel: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    pointerEvents: "none",
    zIndex: 2,
    userSelect: "none",
  },
}));

const GifPreview = ({ gifUrl }) => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [showLabel, setShowLabel] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const imgRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!gifUrl) return;
    
    let cancelled = false;
    
    // Limpar blob URL anterior se existir
    if (blobUrlRef.current) {
      window.URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    
    const fetchGif = async () => {
      try {
        // Normalizar URL
        let urlToFetch = gifUrl;
        const baseURL = process.env.REACT_APP_BACKEND_URL || api.defaults.baseURL || '';
        
        // Se não começa com http, construir URL completa
        if (!urlToFetch.startsWith('http')) {
          // Se começa com /public/, adicionar baseURL
          if (urlToFetch.startsWith('/public/')) {
            urlToFetch = baseURL ? `${baseURL}${urlToFetch}` : urlToFetch;
          } 
          // Se começa com /, adicionar baseURL
          else if (urlToFetch.startsWith('/')) {
            urlToFetch = baseURL ? `${baseURL}${urlToFetch}` : urlToFetch;
          } 
          // Se é apenas o nome do arquivo, construir caminho completo
          else {
            const companyId = user?.companyId || '';
            
            if (companyId) {
              urlToFetch = baseURL ? `${baseURL}/public/company${companyId}/${urlToFetch}` : `/public/company${companyId}/${urlToFetch}`;
            } else {
              // Se não tem companyId, tentar URL relativa
              urlToFetch = baseURL ? `${baseURL}/public/${urlToFetch}` : `/public/${urlToFetch}`;
            }
          }
        }
        
        console.log("DEBUG GIF - Tentando carregar:", { originalUrl: gifUrl, finalUrl: urlToFetch });
        
        const response = await fetch(urlToFetch);
        if (!response.ok) {
          console.error("DEBUG GIF - Erro HTTP:", response.status, response.statusText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (cancelled) return;
        
        // Verificar se o blob está vazio ou corrompido
        if (blob.size === 0) {
          console.error("DEBUG GIF - Blob vazio");
          throw new Error("Arquivo vazio ou corrompido");
        }
        
        console.log("DEBUG GIF - Blob carregado com sucesso, tamanho:", blob.size, "tipo:", blob.type);
        
        const url = window.URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch (err) {
        if (cancelled) return;
        console.error("Erro ao carregar GIF:", err, { gifUrl });
        // Se houver erro, usar URL original diretamente
        setBlobUrl(gifUrl);
      }
    };
    
    fetchGif();
    
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        window.URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [gifUrl]);

  const handleGifClick = () => {
    if (imgRef.current) {
      // Reiniciar o GIF recarregando a imagem
      const src = imgRef.current.src;
      imgRef.current.src = "";
      setTimeout(() => {
        imgRef.current.src = src;
      }, 10);
      setShowLabel(false);
    }
  };

  // Verificar se a URL termina com .mp4 (GIFs convertidos para MP4 pelo WhatsApp)
  // Usar gifUrl original para verificar, não blobUrl
  const isMp4Gif = gifUrl?.toLowerCase().endsWith('.mp4') || 
                   gifUrl?.toLowerCase().includes('.mp4') ||
                   gifUrl?.toLowerCase().includes('mp4');

  return (
    <div 
      className={classes.gifContainer} 
      onClick={handleGifClick}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
    >
      {(blobUrl || gifUrl) && (
        isMp4Gif ? (
          <video
            ref={imgRef}
            src={blobUrl || gifUrl}
            className={classes.gifImage}
            autoPlay
            loop
            muted
            playsInline
            style={{ pointerEvents: 'none' }}
            onError={(e) => {
              console.error("Erro ao carregar vídeo GIF:", e);
              // Tentar usar a URL diretamente sem blob
              if (blobUrl && gifUrl && blobUrl !== gifUrl) {
                e.target.src = gifUrl;
              }
            }}
          />
        ) : (
          <img
            ref={imgRef}
            src={blobUrl || gifUrl}
            alt="GIF"
            className={classes.gifImage}
            onError={(e) => {
              console.error("Erro ao carregar imagem GIF:", e);
              // Tentar usar a URL diretamente sem blob
              if (blobUrl && gifUrl && blobUrl !== gifUrl) {
                e.target.src = gifUrl;
              }
            }}
          />
        )
      )}
      {showLabel && (
        <div className={classes.gifLabel}>
          <Typography variant="body2">GIF</Typography>
        </div>
      )}
    </div>
  );
};

export default GifPreview;
