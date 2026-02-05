import React, { useState, useEffect, useRef, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles(theme => ({
	stickerContainer: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: 0,
		margin: 0,
		maxWidth: "150px",
		maxHeight: "150px",
		backgroundColor: "transparent",
	},
	sticker: {
		width: "auto",
		height: "auto",
		maxWidth: "150px",
		maxHeight: "150px",
		objectFit: "contain",
		borderRadius: "0px",
		cursor: "pointer",
		userSelect: "none",
		display: "block",
	},
	stickerLoading: {
		width: "100px",
		height: "100px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
	},
}));

const StickerPreview = ({ stickerUrl, onClick }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [fetching, setFetching] = useState(true);
	const [blobUrl, setBlobUrl] = useState("");
	const [error, setError] = useState(false);
	const blobUrlRef = useRef(null);

	useEffect(() => {
		if (!stickerUrl) return;
		
		let cancelled = false;
		
		// Limpar blob URL anterior se existir
		if (blobUrlRef.current) {
			window.URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
		
		const fetchSticker = async () => {
			try {
				setFetching(true);
				setError(false);
				
				// Normalizar URL - construir URL completa se necessário
				let urlToFetch = stickerUrl;
				const baseURL = process.env.REACT_APP_BACKEND_URL || api.defaults.baseURL || '';
				const companyId = user?.companyId || '';
				
				if (!companyId) {
					console.error("companyId não disponível para carregar sticker");
					throw new Error("companyId não disponível");
				}
				
				// Construir URL completa baseada no formato do stickerUrl
				if (urlToFetch.startsWith('http')) {
					// URL completa, usar diretamente
				} else if (urlToFetch.startsWith('/public/')) {
					// Já tem /public/, apenas adicionar baseURL
					urlToFetch = baseURL ? `${baseURL}${urlToFetch}` : urlToFetch;
				} else if (urlToFetch.startsWith('stickers/')) {
					// Path relativo com stickers/, construir URL completa
					urlToFetch = `${baseURL}/public/company${companyId}/${urlToFetch}`;
				} else {
					// Apenas nome do arquivo - tentar em ordem de prioridade
					const fileName = urlToFetch;
					const urlsToTry = [
						`${baseURL}/public/company${companyId}/stickers/${fileName}`, // Recebidos/enviados (PRIORIDADE para mensagens)
						`${baseURL}/public/company${companyId}/stickers/salvos/${fileName}`, // Galeria
						`${baseURL}/public/company${companyId}/${fileName}`, // Estrutura antiga
					];
					
					// Tentar cada URL até encontrar uma que funcione
					let foundUrl = null;
					for (const url of urlsToTry) {
						try {
							const testResponse = await fetch(url, { method: 'HEAD' });
							if (testResponse.ok) {
								foundUrl = url;
								break;
							}
						} catch (err) {
							continue;
						}
					}
					
					urlToFetch = foundUrl || urlsToTry[0];
				}
				
				// Log para debug
				console.log("Carregando sticker:", {
					originalUrl: stickerUrl,
					finalUrl: urlToFetch,
					companyId: companyId
				});
				
				// Fazer fetch completo
				let response;
				try {
					response = await fetch(urlToFetch);
				} catch (fetchError) {
					// Se falhar, tentar outras URLs como fallback
					console.warn("Erro no fetch, tentando URLs alternativas:", fetchError);
					
					const fileName = urlToFetch.split('/').pop() || stickerUrl.split('/').pop() || stickerUrl;
					const fallbackUrls = [
						`${baseURL}/public/company${companyId}/stickers/${fileName}`,
						`${baseURL}/public/company${companyId}/stickers/salvos/${fileName}`,
						`${baseURL}/public/company${companyId}/${fileName}`,
					];
					
					let foundFallback = false;
					for (const fallbackUrl of fallbackUrls) {
						if (fallbackUrl === urlToFetch) continue; // Pular a que já tentamos
						try {
							response = await fetch(fallbackUrl);
							if (response.ok) {
								urlToFetch = fallbackUrl;
								foundFallback = true;
								break;
							}
						} catch (e) {
							continue;
						}
					}
					
					if (!foundFallback) {
						throw fetchError;
					}
				}
				
				if (!response.ok) {
					console.error("Erro ao carregar sticker:", {
						status: response.status,
						statusText: response.statusText,
						url: urlToFetch,
						originalUrl: stickerUrl
					});
					throw new Error(`HTTP error! status: ${response.status} - URL: ${urlToFetch}`);
				}
				
				const blob = await response.blob();
				
				if (cancelled) return;
				
				// Verificar se o blob está vazio
				if (blob.size === 0) {
					throw new Error("Arquivo vazio ou corrompido");
				}
				
				// Criar URL do blob preservando o tipo MIME (importante para WebP animado)
				const url = window.URL.createObjectURL(blob);
				blobUrlRef.current = url;
				setBlobUrl(url);
				setFetching(false);
			} catch (err) {
				if (cancelled) return;
				console.error("Erro ao carregar sticker:", {
					error: err.message || err,
					stickerUrl: stickerUrl,
					companyId: user?.companyId
				});
				setError(true);
				setFetching(false);
			}
		};
		
		fetchSticker();
		
		// Cleanup: revogar URL do blob quando o componente for desmontado ou URL mudar
		return () => {
			cancelled = true;
			if (blobUrlRef.current) {
				window.URL.revokeObjectURL(blobUrlRef.current);
				blobUrlRef.current = null;
			}
		};
	}, [stickerUrl, user?.companyId]);

	const handleImageClick = (e) => {
		// Criar um modal para visualizar o sticker em tamanho maior
		const img = e.target;
		const modal = document.createElement("div");
		modal.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: rgba(0, 0, 0, 0.8);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10000;
			cursor: pointer;
		`;
		
		const modalImg = document.createElement("img");
		modalImg.src = img.src;
		modalImg.style.cssText = `
			max-width: 90%;
			max-height: 90%;
			object-fit: contain;
		`;
		
		modal.appendChild(modalImg);
		document.body.appendChild(modal);
		
		const closeModal = () => {
			document.body.removeChild(modal);
		};
		
		modal.addEventListener("click", closeModal);
	};

	if (error) {
		return (
			<div className={classes.stickerContainer}>
				<span style={{ color: "#999", fontSize: "12px" }}>Erro ao carregar sticker</span>
			</div>
		);
	}

	if (fetching) {
		return (
			<div className={classes.stickerContainer}>
				<div className={classes.stickerLoading}>
					<span style={{ color: "#999", fontSize: "12px" }}>Carregando...</span>
				</div>
			</div>
		);
	}

	return (
		<div className={classes.stickerContainer} onClick={onClick}>
			{blobUrl && (
				<img
					className={classes.sticker}
					src={blobUrl}
					alt="Sticker"
					onClick={(e) => {
						// Se há um onClick passado (galeria de seleção), usar ele e não abrir o modal
						if (onClick) {
							e.stopPropagation();
							onClick(e);
						} else {
							// Se não há onClick (sticker em mensagem), abrir modal de visualização
							handleImageClick(e);
						}
					}}
					onError={(e) => {
						console.error("Erro ao exibir sticker", {
							blobUrl,
							stickerUrl,
							companyId: user?.companyId
						});
						setError(true);
					}}
					onLoad={() => {
						// Log para debug - verificar se carregou corretamente
						console.log("Sticker carregado com sucesso:", {
							stickerUrl,
							blobUrl: blobUrl.substring(0, 50) + "..."
						});
					}}
					style={{ 
						cursor: "pointer",
						// Garantir que WebP animado funcione corretamente
						imageRendering: 'auto'
					}}
				/>
			)}
		</div>
	);
};

export default StickerPreview;
