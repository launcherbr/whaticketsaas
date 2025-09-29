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
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
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

const drawerWidth = 310;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
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
    paddingRight: 24,
    color: theme.palette.dark.main,
    background: theme.palette.barraSuperior,
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
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  menuButton: {
    marginRight: 36,
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
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      width: "100%"
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
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(9),
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%"
    }
  },
  appBarSpacer: {
    minHeight: "48px",
  },
  content: {
    flex: 1,
    overflow: "auto",
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
    padding: theme.spacing(1),
    overflowY: "scroll",
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

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

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

  useEffect(() => {
    if (document.body.offsetWidth > 1200) {
      setDrawerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (document.body.offsetWidth < 1000) {
      setDrawerVariant("temporary");
    } else {
      setDrawerVariant("permanent");
    }
  }, [drawerOpen]);

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
    if (document.body.offsetWidth < 600) {
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
      >
        <div className={classes.toolbarIcon}>
          {/* Logo Display with Fallback */}
          {finalLogoUrl && (
            <img
              key={finalLogoUrl} // Add key to force re-render on URL change
              src={`${finalLogoUrl}?r=${Math.random()}`} // Use state variable
              style={{ margin: "0 auto", width: "50%" }}
              alt={`${process.env.REACT_APP_NAME_SYSTEM} Logo`}
              onError={handleLogoError} // Add onError handler
            />
          )}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className={classes.containerWithScroll}>
          <MainListItems drawerClose={drawerClose} collapsed={!drawerOpen} />
        </List>
        <Divider />
      </Drawer>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(
              classes.menuButton,
              drawerOpen && classes.menuButtonHidden
            )}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            {greaterThenSm && user?.profile === "admin" && user?.company?.dueDate ? (
              <>
                Olá <b>{user.name}</b>, Bem vindo a <b>{user?.company?.name}</b>! (Ativo até {dateToClient(user?.company?.dueDate)})
              </>
            ) : (
              <>
                Olá  <b>{user.name}</b>, Bem vindo a <b>{user?.company?.name}</b>!
              </>
            )}
          </Typography>

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
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;
