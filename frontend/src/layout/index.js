import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";
import moment from "moment";
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import MenuOpenIcon from "@material-ui/icons/MenuOpen";
import AccountCircle from "@material-ui/icons/AccountCircle";
import LanguageIcon from "@material-ui/icons/Language";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import UserLanguageSelector from "../components/UserLanguageSelector";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";
import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";
import { useDate } from "../hooks/useDate";
import ColorModeContext from "../layout/themeContext";
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import usePlans from "../hooks/usePlans";

const drawerWidth = 300;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100vh",
    backgroundColor: theme.palette.fancyBackground,
    '& .MuiButton-outlinedPrimary': {
      color: theme.mode === 'light' ? '#FFF' : '#FFF',
      backgroundColor: theme.mode === 'light' ? '#2DDD7F' : '#1c1c1c',
    },
    '& .MuiTab-textColorPrimary.Mui-selected': {
      color: theme.mode === 'light' ? '#2DDD7F' : '#FFF',
    }
  },
  avatar: {
    width: "100%",
  },
  toolbar: {
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(1),
    minHeight: 56,
    color: theme.palette.dark.main,
    background: theme.palette.barraSuperior,
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: theme.spacing(1),
    gap: theme.spacing(1.5),
  },
  companyName: {
    color: 'white',
    fontSize: '1rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  logo: {
    maxHeight: 32,
    width: 'auto',
    cursor: 'pointer',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100px',
      maxHeight: 28,
    }
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px",
    minHeight: "48px",
    [theme.breakpoints.down("sm")]: {
      height: "48px"
    }
  },
  appBar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: theme.zIndex.drawer + 100,
    boxShadow: '0 1px 8px rgba(0,0,0,.3)',
  },
  menuButton: {
    marginRight: theme.spacing(1),
    padding: theme.spacing(1),
    "&:hover": {
      backgroundColor: "transparent",
    },
    "& .MuiTouchRipple-root": {
      display: "none",
    },
  },
  menuIcon: {
    color: "#ffffff",
    transition: "opacity 0.3s ease, transform 0.3s ease",
  },
  menuButtonHidden: {
    display: "none",
  },
  title: {
    flexGrow: 1,
    fontSize: 14,
    color: "white",
  },
  drawerPaper: {
    position: "fixed",
    top: 56,
    left: 0,
    bottom: 0,
    height: "calc(100vh - 56px)",
    whiteSpace: "nowrap",
    width: drawerWidth,
    maxWidth: drawerWidth,
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("md")]: {
      top: 56,
      height: "calc(100vh - 56px)",
      bottom: 0,
      width: "280px",
      maxWidth: "80vw",
    },
    ...theme.scrollbarStylesSoft
  },
  drawerPaperClose: {
    overflowX: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("md")]: {
      width: theme.spacing(9),
    },
    [theme.breakpoints.down("md")]: {
      width: 0,
      transform: "translateX(-100%)",
    },
    position: "fixed",
    top: 56,
    left: 0,
    bottom: 0,
    height: "calc(100vh - 56px)",
    display: "flex",
    flexDirection: "column",
  },
  contentWrapper: {
    display: "flex",
    width: "100%",
    flex: 1,
    marginTop: 56,
    overflow: "hidden",
    height: "calc(100vh - 56px)",
  },
  content: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "auto",
    marginLeft: drawerWidth,
    minWidth: 0,
    transition: theme.transitions.create(["margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("md")]: {
      marginLeft: 0,
    }
  },
  contentShift: {
    marginLeft: theme.spacing(7),
    transition: theme.transitions.create(["margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(9),
    },
    [theme.breakpoints.down("md")]: {
      marginLeft: 0,
    }
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(0.5),
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
    overflowY: "auto",
    overflowX: "hidden",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    ...theme.scrollbarStyles,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 8,
  },
  languageMenuItem: {
    display: 'flex',
    alignItems: 'center',
  },
}));

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user } = useContext(AuthContext);
  const companyId = user?.companyId;
  const { getPlanCompany } = usePlans();
  const [companyName, setCompanyName] = useState("");

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("md"));

  // Default logos based on theme
  const defaultLogoLight = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/interno.png`;
  const defaultLogoDark = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/logo_w.png`;

  // Potential custom logo base URL (will try .png, .jpg, .svg)
  const customLogoBaseUrl = companyId ? `${process.env.REACT_APP_BACKEND_URL}/public/company${companyId}/logotipos/logo` : null;

  // State for the final logo URL to display
  const [finalLogoUrl, setFinalLogoUrl] = useState('');

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);
  const { dateToClient } = useDate();

  const socketManager = useContext(SocketContext);

  // Determine the correct logo URL to attempt loading initially and on theme/company change
  useEffect(() => {
    const themeDefaultLogo = theme.palette.type === 'light' ? defaultLogoLight : defaultLogoDark;
    // Prioritize custom logo if companyId exists, try .png first
    const potentialCustomUrl = customLogoBaseUrl ? `${customLogoBaseUrl}.png` : themeDefaultLogo;
    setFinalLogoUrl(potentialCustomUrl); // Set the initial URL to try

  }, [theme.palette.type, companyId, customLogoBaseUrl, defaultLogoLight, defaultLogoDark]);

  // Buscar nome da company
  useEffect(() => {
    async function fetchCompanyName() {
      if (!companyId) {
        setCompanyName("");
        return;
      }
      try {
        const planConfigs = await getPlanCompany(undefined, companyId);
        if (planConfigs && planConfigs.name) {
          setCompanyName(planConfigs.name);
        }
      } catch (err) {
        console.error("Erro ao buscar nome da empresa:", err);
        setCompanyName("");
      }
    }
    fetchCompanyName();
  }, [companyId, getPlanCompany]);

  useEffect(() => {
    if (document.body.offsetWidth > 1200) {
      setDrawerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (greaterThenSm) {
      setDrawerVariant("permanent");
      setDrawerOpen(true);
    } else {
      setDrawerVariant("temporary");
      setDrawerOpen(false);
    }
  }, [greaterThenSm]);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("companyId");
    const userId = localStorage.getItem("userId");

    const socket = socketManager.getSocket(storedCompanyId);

    socket.on(`company-${storedCompanyId}-auth`, (data) => {
      if (data.user.id === +userId) {
        toastError("Sua conta foi acessada em outro computador.");
        setTimeout(() => {
          localStorage.clear();
          window.location.reload();
        }, 1000);
      }
    });

    socket.emit("userStatus");
    const interval = setInterval(() => {
      socket.emit("userStatus");
    }, 1000 * 60 * 5);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [socketManager]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (!greaterThenSm) {
      setDrawerOpen(false);
    }
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  const toggleColorMode = () => {
    colorMode.toggleColorMode();
    // Logo update is handled by useEffect watching theme.palette.type
  };

  // Fallback logic for image loading errors
  const handleLogoError = (event) => {
    const currentSrc = event.target.src.split('?')[0]; // Get URL without cache buster
    const themeDefaultLogo = theme.palette.type === 'light' ? defaultLogoLight : defaultLogoDark;

    // If the current source is already the default, stop to prevent loops
    if (currentSrc === themeDefaultLogo) {
        console.error("Default logo also failed to load:", currentSrc);
        return;
    }

    // If trying custom .png failed, try custom .jpg
    if (customLogoBaseUrl && currentSrc === `${customLogoBaseUrl}.png`) {
        console.log("Custom logo.png failed, trying logo.jpg");
        setFinalLogoUrl(`${customLogoBaseUrl}.jpg`);
        return; // Try loading jpg
    }

    // If trying custom .jpg failed, try custom .svg
    if (customLogoBaseUrl && currentSrc === `${customLogoBaseUrl}.jpg`) {
        console.log("Custom logo.jpg failed, trying logo.svg");
        setFinalLogoUrl(`${customLogoBaseUrl}.svg`);
        return; // Try loading svg
    }

    // If trying custom .svg failed (or if no custom base URL, or if any other error occurred), fall back to the theme default logo
    if (currentSrc !== themeDefaultLogo) {
        console.log("Custom logo failed or not found, falling back to default:", themeDefaultLogo);
        setFinalLogoUrl(themeDefaultLogo);
    }
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose
          ),
        }}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <div className={classes.containerWithScroll}>
          <List style={{ padding: 0, width: '100%', flex: 1 }}>
            <MainListItems drawerClose={drawerClose} collapsed={!drawerOpen} />
          </List>
        </div>
      </Drawer>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AppBar
        position="fixed"
        className={classes.appBar}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? (
              <MenuOpenIcon className={classes.menuIcon} />
            ) : (
              <MenuIcon className={classes.menuIcon} />
            )}
          </IconButton>

          {/* Logo Display with Fallback */}
          {finalLogoUrl && (
            <div className={classes.branding}>
              <img
                key={finalLogoUrl}
                src={`${finalLogoUrl}?r=${Math.random()}`}
                className={classes.logo}
                alt={`${process.env.REACT_APP_NAME_SYSTEM} Logo`}
                onError={handleLogoError}
                onClick={() => window.location.href = '/'}
              />
              {companyName && (
                <Typography className={classes.companyName}>
                  {companyName}
                </Typography>
              )}
            </div>
          )}

          <div style={{ flexGrow: 1 }} />

          <UserLanguageSelector iconOnly={true} />

          <NotificationsVolume
            setVolume={setVolume}
            volume={volume}
          />

          {user.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              variant="contained"
              style={{ color: "white" }}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}> {/* Adicionado onClick para Logout */}
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
              <MenuItem onClick={toggleColorMode}>
                {theme.palette.type === 'dark' ? (
                  <>
                    <Brightness7Icon style={{ marginRight: 8 }} /> Modo Claro
                  </>
                ) : (
                  <>
                    <Brightness4Icon style={{ marginRight: 8 }} /> Modo Escuro
                  </>
                )}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <div className={classes.contentWrapper}>
        <main className={clsx(classes.content, !drawerOpen && classes.contentShift)}>
          {children ? children : null}
        </main>
      </div>
    </div>
  );
};

export default LoggedInLayout;
