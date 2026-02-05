import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";

// Componentes do Material-UI
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import { Badge, Collapse, List, Tooltip, Zoom } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";

// Contextos
import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { SocketContext } from "../context/Socket/SocketContext";

// Utilitários
import { i18n } from "../translate/i18n";
import { Can } from "../components/Can";
import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import { makeStyles, withStyles } from "@material-ui/core/styles";

// Hooks personalizados
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";

// Ícones de traço fino (Feather Icons)
import {
  FiMessageSquare,
  FiZap,
  FiUsers,
  FiUser,
  FiLayers,
  FiSettings,
  FiRefreshCw,
  FiSearch,
  FiHelpCircle,
  FiCode,
  FiCalendar,
  FiTag,
  FiCheckSquare,
  FiBell,
  FiPieChart,
  FiDollarSign,
  FiDatabase,
  FiLogOut,
  FiChevronDown,
  FiChevronUp,
  FiHome,
  FiBarChart2,
  FiMail,
  FiList,
  FiStar,
  FiCpu,
  FiLink,
  FiFolder,
  FiGrid,
  FiBook,
  FiMic,
  FiServer,
  FiCheckCircle,
  FiCircle
} from "react-icons/fi";

const useStyles = makeStyles((theme) => ({
  ListSubheader: {
    height: 26,
    marginTop: "-15px",
    marginBottom: "-10px",
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 10,
    backgroundColor: theme.palette.sair.main,
    color: theme.palette.text.sair,
    '&:hover': {
      backgroundColor: theme.palette.sair.dark,
    }
  },
  listItem: {
    borderRadius: 8,
    margin: '4px 8px',

    justifyContent: collapsed => collapsed ? 'center' : 'flex-start',
    minHeight: 48,
    padding: collapsed => collapsed ? '8px 12px' : '8px 16px',
  },
  listItemIcon: {
    minWidth: collapsed => collapsed ? 0 : 40,
    marginRight: collapsed => collapsed ? 0 : theme.spacing(2),
    color: theme.palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemText: {
    '& span': {
      fontSize: '0.9rem',
      fontWeight: 500,
    },
    opacity: collapsed => collapsed ? 0 : 1,
    transition: 'opacity 0.2s ease',
    display: collapsed => collapsed ? 'none' : 'block',
  },
  subheader: {
    position: "relative",
    fontSize: "13px",
    textAlign: "left",
    paddingLeft: 28,
    color: theme.palette.primary.main,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    opacity: collapsed => collapsed ? 0 : 1,
    transition: 'opacity 0.2s ease',
    display: collapsed => collapsed ? 'none' : 'block',
  },
  versionBadge: {
    backgroundColor: theme.palette.success.main,
    color: "white",
    fontSize: "10px",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
  },
  nestedItem: {
    paddingLeft: theme.spacing(4),
  },
  connectionBadge: {
    '& .MuiBadge-badge': {
      right: -5,
      top: 8,
      padding: '0 4px',
      backgroundColor: theme.palette.error.main,
      fontWeight: 'bold',
      fontSize: '10px'
    }
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeItem: {
    //backgroundColor: theme.palette.action.selected + '!important',
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    '& $listItemIcon': {
      color: theme.palette.primary.main,
    }
  },
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3],
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  menuWrapper: {
    width: collapsed => collapsed ? 40 : 280,
    transition: 'width 0.3s ease',
    overflow: 'hidden',
  },
  versionContainer: {
    fontSize: "12px", 
    padding: "10px", 
    textAlign: "right", 
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "4px",
    opacity: collapsed => collapsed ? 0 : 1,
    transition: 'opacity 0.2s ease',
  }
}));

// Badge personalizado para notificações
const StyledBadge = withStyles((theme) => ({
  badge: {
    right: -3,
    top: 8,
    padding: '0 4px',
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
}))(Badge);

// Componente Tooltip personalizado
const CustomTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3],
    fontSize: '0.8rem',
    fontWeight: 500,
    borderRadius: 8,
  },
}))(Tooltip);

function ListItemLink(props) {
  const { icon, primary, to, className, isActive, collapsed } = props;
  const classes = useStyles(collapsed);

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  const listItemContent = (
    <ListItem 
      button 
      dense 
      component={renderLink} 
      className={`${classes.listItem} ${className} ${isActive ? classes.activeItem : ''}`}
    >
      <ListItemIcon className={classes.listItemIcon}>
        <div className={classes.iconWrapper}>
          {icon}
        </div>
      </ListItemIcon>
      <ListItemText 
        primary={primary} 
        className={classes.listItemText}
      />
    </ListItem>
  );

  if (collapsed) {
    return (
      <li>
        <CustomTooltip 
          title={primary} 
          placement="right" 
          TransitionComponent={Zoom}
          arrow
        >
          {listItemContent}
        </CustomTooltip>
      </li>
    );
  }

  return (
    <li>
      {listItemContent}
    </li>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = (props) => {
  const { drawerClose, collapsed } = props;
  const classes = useStyles(collapsed);
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, handleLogout } = useContext(AuthContext);
  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false); 
  const history = useHistory();
  const location = useLocation();
  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);
  const [activePath, setActivePath] = useState(location.pathname);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const { getPlanCompany } = usePlans();
  
  const [version, setVersion] = useState(null);
  const { getVersion } = useVersion();

  const socketManager = useContext(SocketContext);

  // Atualizar o caminho ativo quando a rota mudar
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  useEffect(() => {
    async function fetchVersion() {
      try {
        const _version = await getVersion();
        if (_version && _version.version) {
          setVersion(_version.version);
        }
      } catch (err) {
        // Ignorar erro ao buscar versão
        console.error("Erro ao buscar versão:", err);
      }
    }
    fetchVersion();
  }, [getVersion]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);

      setShowCampaigns(planConfigs.plan.useCampaigns);
      setShowKanban(planConfigs.plan.useKanban);
      setShowOpenAi(planConfigs.plan.useOpenAi);
      setShowIntegrations(planConfigs.plan.useIntegrations);
      setShowSchedules(planConfigs.plan.useSchedules);
      setShowInternalChat(planConfigs.plan.useInternalChat);
      setShowExternalApi(planConfigs.plan.useExternalApi);
    }
    fetchData();
  }, [getPlanCompany, user.companyId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-chat`, (data) => {
      if (data.action === "new-message") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
      if (data.action === "update") {
        dispatch({ type: "CHANGE_CHAT", payload: data });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    if (localStorage.getItem("cshow")) {
      setShowCampaigns(true);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  const handleClickLogout = () => {
    handleLogout();
  };

  // Função auxiliar para verificar se um caminho está ativo
  const isActivePath = (path) => {
    return activePath === path || activePath.startsWith(path + '/');
  };

  return (
    <div className={classes.menuWrapper} onClick={drawerClose}>
      <Can
        role={user.profile}
        perform={"drawer-service-items:view"}
        style={{
          overflowY: "auto",
          overflowX: "hidden",
        }}
        no={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              className={classes.subheader}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.sections.atendimento")}
            </ListSubheader>
            <>
              <ListItemLink
                to="/tickets"
                primary={i18n.t("mainDrawer.listItems.tickets")}
                icon={<FiMessageSquare size={18} />}
                isActive={isActivePath('/tickets')}
                collapsed={collapsed}
              />
              <ListItemLink
                to="/quick-messages"
                primary={i18n.t("mainDrawer.listItems.quickMessages")}
                icon={<FiZap size={18} />}
                isActive={isActivePath('/quick-messages')}
                collapsed={collapsed}
              />
              {showKanban && (
                <ListItemLink
                  to="/kanban"
                  primary={i18n.t("mainDrawer.listItems.kanban")}
                  icon={<FiCheckSquare size={18} />}
                  isActive={isActivePath('/kanban')}
                  collapsed={collapsed}
                />
              )}
              <ListItemLink
                to="/todolist"
                primary={i18n.t("mainDrawer.listItems.tasks")}
                icon={<FiList size={18} />}
                isActive={isActivePath('/todolist')}
                collapsed={collapsed}
              />
              <ListItemLink
                to="/contacts"
                primary={i18n.t("mainDrawer.listItems.contacts")}
                icon={<FiUser size={18} />}
                isActive={isActivePath('/contacts')}
                collapsed={collapsed}
              />
              {showSchedules && (
                <ListItemLink
                  to="/schedules"
                  primary={i18n.t("mainDrawer.listItems.schedules")}
                  icon={<FiCalendar size={18} />}
                  isActive={isActivePath('/schedules')}
                  collapsed={collapsed}
                />
              )}
              <ListItemLink
                to="/tags"
                primary={i18n.t("mainDrawer.listItems.tags")}
                icon={<FiTag size={18} />}
                isActive={isActivePath('/tags')}
                collapsed={collapsed}
              />
              {showInternalChat && (
                <ListItemLink
                  to="/chats"
                  primary={i18n.t("mainDrawer.listItems.chats")}
                  icon={
                    <StyledBadge color="secondary" variant="dot" invisible={invisible}>
                      <FiMessageSquare size={18} />
                    </StyledBadge>
                  }
                  isActive={isActivePath('/chats')}
                  collapsed={collapsed}
                />
              )}
              <ListItemLink
                to="/helps"
                primary={i18n.t("mainDrawer.listItems.helps")}
                icon={<FiHelpCircle size={18} />}
                isActive={isActivePath('/helps')}
                collapsed={collapsed}
              />
            </>
          </>
        )}
      />

      <Can
        role={user.profile}
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <ListSubheader
              hidden={collapsed}
              className={classes.subheader}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.sections.gerencia")}
            </ListSubheader>

            <ListItemLink
              to="/"
              primary={i18n.t("mainDrawer.listItems.dashboard")}
              icon={<FiHome size={18} />}
              isActive={isActivePath('/')}
              collapsed={collapsed}
            />
            
            <ListItemLink
              to="/relatorios"
              primary={i18n.t("mainDrawer.listItems.reports")}
              icon={<FiBarChart2 size={18} />}
              isActive={isActivePath('/relatorios')}
              collapsed={collapsed}
            />
          </>
        )}
      />
      
      <Can
        role={user.profile}
        perform="drawer-admin-items:view"
        yes={() => (
          <>
            {showCampaigns && (
              <>
              <ListSubheader
                hidden={collapsed}
                className={classes.subheader}
                inset
                color="inherit"
              >
                {i18n.t("mainDrawer.sections.campanhas")}
              </ListSubheader>

                <ListItemLink
                  to="/campaigns"
                  primary={i18n.t("mainDrawer.listItems.listagem")}
                  icon={<FiMail size={18} />}
                  isActive={isActivePath('/campaigns')}
                  collapsed={collapsed}
                />

                <ListItemLink
                  to="/contact-lists"
                  primary={i18n.t("mainDrawer.listItems.contactLists")}
                  icon={<FiUsers size={18} />}
                  isActive={isActivePath('/contact-lists')}
                  collapsed={collapsed}
                />

                <ListItemLink
                  to="/campaigns-config"
                  primary={i18n.t("mainDrawer.listItems.campaignsConfig")}
                  icon={<FiSettings size={18} />}
                  isActive={isActivePath('/campaigns-config')}
                  collapsed={collapsed}
                />
              </>
            )}

            <ListSubheader
              hidden={collapsed}
              className={classes.subheader}
              inset
              color="inherit"
            >
              {i18n.t("mainDrawer.sections.administracao")}
            </ListSubheader>

            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t("mainDrawer.listItems.annoucements")}
                icon={<FiBell size={18} />}
                isActive={isActivePath('/announcements')}
                collapsed={collapsed}
              />
            )}
            
            {showOpenAi && (
              <ListItemLink
                to="/prompts"
                primary={i18n.t("mainDrawer.listItems.prompts")}
                icon={<FiCpu size={18} />}
                isActive={isActivePath('/prompts')}
                collapsed={collapsed}
              />
            )}

            {showIntegrations && (
              <ListItemLink
                to="/queue-integration"
                primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                icon={<FiLink size={18} />}
                isActive={isActivePath('/queue-integration')}
                collapsed={collapsed}
              />
            )}
            
            <ListItemLink
              to="/connections"
              primary={i18n.t("mainDrawer.listItems.connections")}
              icon={
                <Badge 
                  badgeContent={connectionWarning ? "!" : 0} 
                  color="error"
                  className={classes.connectionBadge}
                >
                  <FiRefreshCw size={18} />
                </Badge>
              }
              isActive={isActivePath('/connections')}
              collapsed={collapsed}
            />
            
            <ListItemLink
              to="/files"
              primary={i18n.t("mainDrawer.listItems.files")}
              icon={<FiFolder size={18} />}
              isActive={isActivePath('/files')}
              collapsed={collapsed}
            />
            
            <ListItemLink
              to="/queues"
              primary={i18n.t("mainDrawer.listItems.queues")}
              icon={<FiLayers size={18} />}
              isActive={isActivePath('/queues')}
              collapsed={collapsed}
            />
            
            <ListItemLink
              to="/users"
              primary={i18n.t("mainDrawer.listItems.users")}
              icon={<FiUsers size={18} />}
              isActive={isActivePath('/users')}
              collapsed={collapsed}
            />
            
            {showExternalApi && (
              <ListItemLink
                to="/messages-api"
                primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                icon={<FiCode size={18} />}
                isActive={isActivePath('/messages-api')}
                collapsed={collapsed}
              />
            )}
            
            <ListItemLink
              to="/financeiro"
              primary={i18n.t("mainDrawer.listItems.financeiro")}
              icon={<FiDollarSign size={18} />}
              isActive={isActivePath('/financeiro')}
              collapsed={collapsed}
            />

            <ListItemLink
              to="/settings"
              primary={i18n.t("mainDrawer.listItems.settings")}
              icon={<FiSettings size={18} />}
              isActive={isActivePath('/settings')}
              collapsed={collapsed}
            />
            
            {user.super && (	
              <ListSubheader
                hidden={collapsed}
                className={classes.subheader}
                inset
                color="inherit"
              >
                {i18n.t("mainDrawer.sections.sistema")}
              </ListSubheader>
            )}
            
            {user.super && (
              <ListItemLink
                to="/backups"
                primary={i18n.t("mainDrawer.listItems.backups")}
                icon={<FiDatabase size={18} />}
                isActive={isActivePath('/backups')}
                collapsed={collapsed}
              />
            )}
            
            {!collapsed && version && version !== "false" && version !== false && (
              <React.Fragment>
                <Divider />
                <div className={classes.versionContainer}>
                  {`v${version}`}
                  <span className={classes.versionBadge}>
                    latest
                  </span>
                </div>
              </React.Fragment>
            )}
          </>
        )}
      />
      
      <Divider />
      <li>
        {collapsed ? (
          <CustomTooltip title={i18n.t("mainDrawer.appBar.user.logout")} placement="right" TransitionComponent={Zoom} arrow>
            <ListItem
              button
              dense
              onClick={handleClickLogout}
              className={classes.logoutButton}
            >
              <ListItemIcon className={classes.listItemIcon}>
                <div className={classes.iconWrapper}>
                  <FiLogOut size={18} />
                </div>
              </ListItemIcon>
              <ListItemText 
                primary={i18n.t("mainDrawer.appBar.user.logout")} 
                className={classes.listItemText}
              />
            </ListItem>
          </CustomTooltip>
        ) : (
          <ListItem
            button
            dense
            onClick={handleClickLogout}
            className={classes.logoutButton}
          >
            <ListItemIcon className={classes.listItemIcon}>
              <div className={classes.iconWrapper}>
                <FiLogOut size={18} />
              </div>
            </ListItemIcon>
            <ListItemText 
              primary={i18n.t("mainDrawer.appBar.user.logout")} 
              className={classes.listItemText}
            />
          </ListItem>
        )}
      </li>
    </div>
  );
};

export default MainListItems;
