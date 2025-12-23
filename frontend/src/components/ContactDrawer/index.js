import React, { useEffect, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Drawer from "@material-ui/core/Drawer";
import Link from "@material-ui/core/Link";
import InputLabel from "@material-ui/core/InputLabel";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import CreateIcon from '@material-ui/icons/Create';
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import LinkIcon from '@material-ui/icons/Link';
import ImageIcon from '@material-ui/icons/Image';
import VideoLibraryIcon from '@material-ui/icons/VideoLibrary';
import AudiotrackIcon from '@material-ui/icons/Audiotrack';

import { i18n } from "../../translate/i18n";
import api from "../../services/api";

import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
import MarkdownWrapper from "../MarkdownWrapper";
import { CardHeader } from "@material-ui/core";
import { ContactForm } from "../ContactForm";
import ContactModal from "../ContactModal";
import { ContactNotes } from "../ContactNotes";

import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";

const drawerWidth = 320;

const useStyles = makeStyles(theme => ({
	drawer: {
		width: drawerWidth,
		flexShrink: 0,
	},
	drawerPaper: {
		width: drawerWidth,
		display: "flex",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
		borderRight: "1px solid rgba(0, 0, 0, 0.12)",
		borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
		borderTopRightRadius: 4,
		borderBottomRightRadius: 4,
	},
	header: {
		display: "flex",
		borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
		backgroundColor: theme.palette.contactdrawer, //DARK MODE//
		alignItems: "center",
		padding: theme.spacing(0, 1),
		minHeight: "73px",
		justifyContent: "flex-start",
	},
	content: {
		display: "flex",
		backgroundColor: theme.palette.contactdrawer, //DARK MODE//
		flexDirection: "column",
		padding: "8px 0px 8px 8px",
		height: "100%",
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},

	contactAvatar: {
		margin: 15,
		width: 100,
		height: 100,
	},

	contactHeader: {
		display: "flex",
		padding: 8,
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		"& > *": {
			margin: 4,
		},
	},

	contactDetails: {
		marginTop: 8,
		padding: 8,
		display: "flex",
		flexDirection: "column",
	},
	contactExtraInfo: {
		marginTop: 4,
		padding: 6,
	},
	tabsContainer: {
		backgroundColor: theme.palette.type === 'dark' ? '#202c33' : '#ffffff',
		borderBottom: `1px solid ${theme.palette.type === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
		overflowX: "auto",
		overflowY: "hidden",
		...theme.scrollbarStyles,
	},
	tabs: {
		minHeight: "48px",
		"& .MuiTab-root": {
			minHeight: "48px",
			textTransform: "none",
			fontSize: "12px",
			fontWeight: 500,
			minWidth: "auto",
			padding: "12px 16px",
		},
		"& .Mui-selected": {
			color: theme.palette.type === 'dark' ? '#00a884' : '#008069',
		},
		"& .MuiTabs-scrollButtons": {
			"&.Mui-disabled": {
				opacity: 0.3,
			},
		},
	},
	tabPanel: {
		padding: theme.spacing(2),
		backgroundColor: theme.palette.type === 'dark' ? '#111b21' : '#f0f2f5',
		minHeight: "200px",
		maxHeight: "300px",
		overflowY: "auto",
		overflowX: "auto",
		...theme.scrollbarStyles,
	},
	mediaGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(3, 1fr)",
		gap: theme.spacing(1),
		padding: theme.spacing(1),
	},
	mediaThumbnail: {
		position: "relative",
		width: "100%",
		paddingTop: "100%",
		borderRadius: theme.spacing(0.5),
		overflow: "hidden",
		cursor: "pointer",
		backgroundColor: theme.palette.type === 'dark' ? '#202c33' : '#e4e6eb',
		"&:hover": {
			opacity: 0.8,
		},
	},
	mediaImage: {
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
		objectFit: "cover",
	},
	mediaIcon: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		fontSize: "24px",
		color: theme.palette.type === 'dark' ? '#8696a0' : '#667781',
	},
	linkItem: {
		padding: theme.spacing(1),
		marginBottom: theme.spacing(0.5),
		backgroundColor: theme.palette.type === 'dark' ? '#202c33' : '#ffffff',
		borderRadius: theme.spacing(0.5),
		cursor: "pointer",
		"&:hover": {
			backgroundColor: theme.palette.type === 'dark' ? '#2a3942' : '#f5f6f6',
		},
	},
	linkUrl: {
		fontSize: "11px",
		color: theme.palette.type === 'dark' ? '#008069' : '#008069',
		wordBreak: "break-all",
		marginTop: theme.spacing(0.5),
	},
	linkPreview: {
		fontSize: "12px",
		color: theme.palette.type === 'dark' ? '#e9edef' : '#111b21',
	},
}));

const TabPanel = ({ children, value, index, className }) => {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`tabpanel-${index}`}
			aria-labelledby={`tab-${index}`}
			className={className}
		>
			{value === index && <Box>{children}</Box>}
		</div>
	);
};

const ContactDrawer = ({ open, handleDrawerClose, contact, ticket, loading }) => {
	const classes = useStyles();

	const [modalOpen, setModalOpen] = useState(false);
	const [openForm, setOpenForm] = useState(false);
	const [tabValue, setTabValue] = useState(0);
	const [allMessages, setAllMessages] = useState([]);
	const [loadingMessages, setLoadingMessages] = useState(false);

	useEffect(() => {
		setOpenForm(false);
		if (ticket?.id) {
			fetchAllMessages();
		}
	}, [open, contact, ticket]);

	const fetchAllMessages = async () => {
		if (!ticket?.id) return;
		
		setLoadingMessages(true);
		try {
			let allMsgs = [];
			let pageNumber = 1;
			let hasMore = true;

			while (hasMore) {
				const { data } = await api.get(`/messages/${ticket.id}`, {
					params: { pageNumber }
				});
				
				if (data.messages && data.messages.length > 0) {
					allMsgs = [...allMsgs, ...data.messages];
					hasMore = data.hasMore;
					pageNumber++;
				} else {
					hasMore = false;
				}
			}

			setAllMessages(allMsgs);
		} catch (err) {
			console.error("Erro ao buscar mensagens:", err);
		} finally {
			setLoadingMessages(false);
		}
	};

	const getMediaMessages = () => {
		return allMessages.filter(msg => 
			msg.mediaUrl && 
			(msg.mediaType === "image" || msg.mediaType === "video" || msg.mediaType === "audio")
		);
	};

	const getDocumentMessages = () => {
		return allMessages.filter(msg => {
			if (!msg.mediaUrl) return false;
			
			// Verifica tipos de mídia explícitos de documento
			if (msg.mediaType === "document" || 
				msg.mediaType === "application" || 
				msg.mediaType === "documentMessage" ||
				msg.mediaType === "documentWithCaptionMessage") {
				return true;
			}
			
			// Verifica se o tipo contém "document"
			if (msg.mediaType && msg.mediaType.includes("document")) {
				return true;
			}
			
			// Verifica no dataJson se foi enviado como documento
			if (msg.dataJson) {
				try {
					const data = JSON.parse(msg.dataJson);
					// Verifica se tem documentMessage no dataJson
					if (data?.message?.documentMessage || 
						data?.message?.documentWithCaptionMessage?.message?.documentMessage) {
						return true;
					}
				} catch (e) {
					// Ignora erro de parsing
				}
			}
			
			// Verifica extensões de arquivo comuns de documentos
			const documentExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|csv|zip|rar|7z|tar|gz|psd|ai|eps|indd|xd|sketch|dwg|dxf|svg|xml|json|html|htm|css|js|ts|py|java|cpp|c|h|php|rb|go|rs|swift|kt|dart|sql|db|sqlite|mdb|accdb|pages|numbers|key|keynote)$/i;
			if (msg.mediaUrl && documentExtensions.test(msg.mediaUrl)) {
				return true;
			}
			
			// Se tem mediaUrl mas não é imagem, vídeo ou áudio conhecido, considera como documento
			if (msg.mediaUrl && !msg.mediaType) {
				const mediaUrlLower = msg.mediaUrl.toLowerCase();
				const isMediaFile = /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|mp4|avi|mov|wmv|flv|mkv|webm|mp3|ogg|wav|m4a|aac|flac)$/i.test(mediaUrlLower);
				if (!isMediaFile) {
					return true;
				}
			}
			
			// Se tem body mas não é mídia conhecida e tem mediaUrl, pode ser documento
			if (msg.body && !msg.mediaType && msg.mediaUrl && !msg.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp|mp4|avi|mov|mp3|ogg|wav)$/i)) {
				return true;
			}
			
			return false;
		});
	};

	const extractLinks = () => {
		const links = [];
		allMessages.forEach(msg => {
			if (msg.body) {
				const urlRegex = /(https?:\/\/[^\s]+)/g;
				const matches = msg.body.match(urlRegex);
				if (matches) {
					matches.forEach(url => {
						links.push({
							url,
							preview: msg.body.replace(url, '').trim() || url,
							date: msg.createdAt
						});
					});
				}
			}
		});
		return links;
	};

	const handleTabChange = (event, newValue) => {
		setTabValue(newValue);
	};

	// Função helper para normalizar URLs
	const normalizeMediaUrl = (url) => {
		if (!url) return null;
		
		if (url.startsWith('/')) {
			const baseURL = process.env.REACT_APP_BACKEND_URL || api.defaults.baseURL || 'http://localhost:3000';
			url = `${baseURL}${url}`;
		}
		
		try {
			const urlObj = new URL(url);
			if (urlObj.host.includes(':')) {
				const parts = urlObj.host.split(':');
				if (parts.length > 2) {
					urlObj.host = parts[0] + ':' + parts[parts.length - 1];
				}
			}
			return urlObj.toString();
		} catch (e) {
			url = url.replace(/:(\d+):(\d+)/g, ':$2');
			try {
				return new URL(url).toString();
			} catch (e2) {
				console.error('URL inválida:', url);
				return null;
			}
		}
	};

	const handleMediaClick = (message) => {
		if (!message.mediaUrl) return;
		const url = normalizeMediaUrl(message.mediaUrl);
		if (url) {
			window.open(url, '_blank');
		}
	};

	const handleLinkClick = (url) => {
		window.open(url, '_blank');
	};

	const mediaMessages = getMediaMessages();
	const documentMessages = getDocumentMessages();
	const links = extractLinks();

	return (
		<>
			<Drawer
				className={classes.drawer}
				variant="persistent"
				anchor="right"
				open={open}
				PaperProps={{ style: { position: "absolute" } }}
				BackdropProps={{ style: { position: "absolute" } }}
				ModalProps={{
					container: document.getElementById("drawer-container"),
					style: { position: "absolute" },
				}}
				classes={{
					paper: classes.drawerPaper,
				}}
			>
				<div className={classes.header}>
					<IconButton onClick={handleDrawerClose}>
						<CloseIcon />
					</IconButton>
					<Typography style={{ justifySelf: "center" }}>
						{i18n.t("contactDrawer.header")}
					</Typography>
				</div>
				{loading ? (
					<ContactDrawerSkeleton classes={classes} />
				) : (
					<div className={classes.content}>
						<Paper square variant="outlined" className={classes.contactHeader}>
							<CardHeader
								onClick={() => {}}
								style={{ cursor: "pointer", width: '100%' }}
								titleTypographyProps={{ noWrap: true }}
								subheaderTypographyProps={{ noWrap: true }}
								avatar={<Avatar
                      src={contact.profilePicUrl}
                      alt="contact_image"
                      style={{ width: 60, height: 60, backgroundColor: generateColor(contact?.number), color: "white", fontWeight: "bold" }}
                    >
                      {getInitials(contact?.name)}
                    </Avatar>}
								title={
									<>
										<Typography onClick={() => setOpenForm(true)}>
											{contact.name}
											<CreateIcon style={{fontSize: 16, marginLeft: 5}} />
										</Typography>
									</>
								}
								subheader={
									<>
										<Typography style={{fontSize: 12}}>
											<Link href={`tel:${contact.number}`}>{contact.number}</Link>
										</Typography>
										<Typography style={{fontSize: 12}}>
											<Link href={`mailto:${contact.email}`}>{contact.email}</Link>
										</Typography>
									</>
								}
							/>
							<Button
								variant="outlined"
								color="primary"
								onClick={() => setModalOpen(!openForm)}
								style={{fontSize: 12}}
							>
								{i18n.t("contactDrawer.buttons.edit")}
							</Button>
							{(contact.id && openForm) && <ContactForm initialContact={contact} onCancel={() => setOpenForm(false)} />}
						</Paper>

						{/* Abas: Mídia, Links, Documentos */}
						{(mediaMessages.length > 0 || documentMessages.length > 0 || links.length > 0) && (
							<Paper square variant="outlined" className={classes.contactDetails}>
								<div className={classes.tabsContainer}>
									<Tabs
										value={tabValue}
										onChange={handleTabChange}
										indicatorColor="primary"
										textColor="primary"
										className={classes.tabs}
										variant="scrollable"
										scrollButtons="auto"
									>
										<Tab 
											label={`Mídia (${mediaMessages.length})`} 
											icon={<ImageIcon style={{ fontSize: 16 }} />}
											iconPosition="start"
										/>
										<Tab 
											label={`Links (${links.length})`} 
											icon={<LinkIcon style={{ fontSize: 16 }} />}
											iconPosition="start"
										/>
										<Tab 
											label={`Docs (${documentMessages.length})`} 
											icon={<InsertDriveFileIcon style={{ fontSize: 16 }} />}
											iconPosition="start"
										/>
									</Tabs>
								</div>

								<TabPanel value={tabValue} index={0} className={classes.tabPanel}>
									{loadingMessages ? (
										<Typography style={{ textAlign: "center", color: "#8696a0", padding: 20, fontSize: 12 }}>
											Carregando...
										</Typography>
									) : mediaMessages.length > 0 ? (
										<div className={classes.mediaGrid}>
											{mediaMessages.map((msg) => {
												const normalizedUrl = normalizeMediaUrl(msg.mediaUrl);
												return (
													<div
														key={msg.id}
														className={classes.mediaThumbnail}
														onClick={() => handleMediaClick(msg)}
													>
														{msg.mediaType === "image" ? (
															<img
																src={normalizedUrl || msg.mediaUrl}
																alt=""
																className={classes.mediaImage}
																onError={(e) => {
																	e.target.style.display = "none";
																}}
															/>
														) : msg.mediaType === "video" ? (
															<>
																<video
																	src={normalizedUrl || msg.mediaUrl}
																	className={classes.mediaImage}
																	style={{ opacity: 0.7 }}
																/>
																<VideoLibraryIcon className={classes.mediaIcon} />
															</>
														) : (
															<AudiotrackIcon className={classes.mediaIcon} />
														)}
													</div>
												);
											})}
										</div>
									) : (
										<Typography style={{ textAlign: "center", color: "#8696a0", padding: 20, fontSize: 12 }}>
											Nenhuma mídia encontrada
										</Typography>
									)}
								</TabPanel>

								<TabPanel value={tabValue} index={1} className={classes.tabPanel}>
									{loadingMessages ? (
										<Typography style={{ textAlign: "center", color: "#8696a0", padding: 20, fontSize: 12 }}>
											Carregando...
										</Typography>
									) : links.length > 0 ? (
										links.map((link, index) => (
											<div
												key={index}
												className={classes.linkItem}
												onClick={() => handleLinkClick(link.url)}
											>
												<LinkIcon style={{ fontSize: 14, marginRight: 8, verticalAlign: "middle" }} />
												<Typography className={classes.linkPreview}>
													{link.preview}
												</Typography>
												<Typography className={classes.linkUrl}>
													{link.url}
												</Typography>
											</div>
										))
									) : (
										<Typography style={{ textAlign: "center", color: "#8696a0", padding: 20, fontSize: 12 }}>
											Nenhum link encontrado
										</Typography>
									)}
								</TabPanel>

								<TabPanel value={tabValue} index={2} className={classes.tabPanel}>
									{loadingMessages ? (
										<Typography style={{ textAlign: "center", color: "#8696a0", padding: 20, fontSize: 12 }}>
											Carregando...
										</Typography>
									) : documentMessages.length > 0 ? (
										documentMessages.map((msg) => {
											const formatFileSize = (bytes) => {
												if (!bytes) return '';
												if (bytes < 1024) return bytes + ' B';
												if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
												return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
											};

											const getFileName = () => {
												// Tenta extrair do dataJson primeiro (mensagens do Baileys)
												if (msg.dataJson) {
													try {
														const data = JSON.parse(msg.dataJson);
														const docMsg = data?.message?.documentMessage || 
																      data?.message?.documentWithCaptionMessage?.message?.documentMessage;
														if (docMsg?.fileName) {
															return docMsg.fileName;
														}
													} catch (e) {
														// Ignora erro de parsing
													}
												}
												
												if (msg.body) {
													const lines = msg.body.split('\n');
													for (let line of lines) {
														if (line.includes('.') && !line.startsWith('http') && !line.match(/^\d+\s*(B|KB|MB|GB)/i)) {
															return line.trim();
														}
													}
												}
												if (msg.mediaUrl) {
													const urlParts = msg.mediaUrl.split('/');
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
												return msg.body || 'Documento';
											};

											const getFileExtension = (filename) => {
												if (!filename) return '';
												const parts = filename.split('.');
												return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
											};

											const fileName = getFileName();
											const fileExt = getFileExtension(fileName);
											
											// Tenta obter tamanho do arquivo do dataJson
											let fileSize = '';
											if (msg.dataJson) {
												try {
													const data = JSON.parse(msg.dataJson);
													const docMsg = data?.message?.documentMessage || 
															      data?.message?.documentWithCaptionMessage?.message?.documentMessage;
													if (docMsg?.fileLength) {
														fileSize = formatFileSize(parseInt(docMsg.fileLength));
													}
												} catch (e) {
													// Ignora erro de parsing
												}
											}
											
											// Se não encontrou no dataJson, tenta do body
											if (!fileSize && msg.body) {
												const fileSizeMatch = msg.body?.match(/(\d+)\s*(B|KB|MB|GB)/i);
												fileSize = fileSizeMatch ? fileSizeMatch[0] : '';
											}

											return (
												<div
													key={msg.id}
													className={classes.linkItem}
													onClick={() => handleMediaClick(msg)}
													style={{ display: "flex", alignItems: "center", padding: "12px" }}
												>
													<InsertDriveFileIcon style={{ fontSize: 32, marginRight: 12, color: "#0084ff" }} />
													<div style={{ flex: 1, minWidth: 0 }}>
														<Typography className={classes.linkPreview} style={{ 
															fontSize: "13px",
															fontWeight: 500,
															marginBottom: 4,
															overflow: "hidden",
															textOverflow: "ellipsis",
															whiteSpace: "nowrap"
														}}>
															{fileName.length > 40 ? fileName.substring(0, 40) + '...' : fileName}
														</Typography>
														<Typography className={classes.linkUrl} style={{ fontSize: "11px" }}>
															{fileExt ? `${fileExt} • ` : ''}{fileSize || 'Arquivo'}
														</Typography>
													</div>
												</div>
											);
										})
									) : (
										<Typography style={{ textAlign: "center", color: "#8696a0", padding: 20, fontSize: 12 }}>
											Nenhum documento encontrado
										</Typography>
									)}
								</TabPanel>
							</Paper>
						)}

						<Paper square variant="outlined" className={classes.contactDetails}>
							<Typography variant="subtitle1" style={{marginBottom: 10}}>
								{i18n.t("ticketOptionsMenu.appointmentsModal.title")}
							</Typography>
							<ContactNotes ticket={ticket} />
						</Paper>
						<Paper square variant="outlined" className={classes.contactDetails}>
							<ContactModal
								open={modalOpen}
								onClose={() => setModalOpen(false)}
								contactId={contact.id}
							></ContactModal>
							<Typography variant="subtitle1">
								{i18n.t("contactDrawer.extraInfo")}
							</Typography>
							{contact?.extraInfo?.map(info => (
								<Paper
									key={info.id}
									square
									variant="outlined"
									className={classes.contactExtraInfo}
								>
									<InputLabel>{info.name}</InputLabel>
									<Typography component="div" noWrap style={{ paddingTop: 2 }}>
										<MarkdownWrapper>{info.value}</MarkdownWrapper>
									</Typography>
								</Paper>
							))}
						</Paper>
					</div>
				)}
			</Drawer>
		</>
	);
};

export default ContactDrawer;
