import React, { useState, useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";

// Material-UI Components
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import IconButton from "@material-ui/core/IconButton";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import CircularProgress from "@material-ui/core/CircularProgress";
import useMediaQuery from "@material-ui/core/useMediaQuery";

// Custom Imports
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.palette.type === 'dark' 
      ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)' 
      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '50vh',
      background: theme.palette.primary.dark, // Usando primary.dark
      borderBottomLeftRadius: '50% 20%',
      borderBottomRightRadius: '50% 20%',
      zIndex: 0,
    }
  },
  loginContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    margin: theme.spacing(2),
    zIndex: 1,
  },
  loginCard: {
    padding: theme.spacing(4, 3),
    borderRadius: 16,
    boxShadow: theme.shadows[4],
    background: theme.palette.background.paper,
    textAlign: 'center',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.shadows[6],
    }
  },
  logoContainer: {
    width: 100,
    height: 100,
    margin: '0 auto -50px',
    borderRadius: '50%',
    background: theme.palette.primary.dark, // Usando primary.dark
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: theme.shadows[4],
    border: '4px solid ' + (theme.palette.type === 'dark' ? theme.palette.grey[900] : 'white'),
    position: 'relative',
    zIndex: 2,
    '& img': {
      width: '70%',
      height: 'auto',
      filter: 'brightness(0) invert(1)',
    }
  },
  formTitle: {
    margin: theme.spacing(5, 0, 3),
    color: theme.palette.text.primary,
    fontWeight: 700,
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
  inputField: {
    marginBottom: theme.spacing(2),
    '& .MuiOutlinedInput-root': {
      borderRadius: 8,
      backgroundColor: theme.palette.background.default,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.light,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: theme.palette.primary.main,
      },
    },
  },
  submitButton: {
    margin: theme.spacing(3, 0, 2),
    padding: theme.spacing(1.5),
    borderRadius: 8,
    fontWeight: 600,
    fontSize: '1rem',
    letterSpacing: 0.5,
    textTransform: 'none',
    boxShadow: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  linkText: {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    textDecoration: 'none',
    display: 'inline-block',
    margin: theme.spacing(1, 0),
    transition: 'color 0.2s ease',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: '50%',
    background: theme.palette.type === 'dark' 
      ? 'rgba(255,255,255,0.05)' 
      : 'rgba(255,255,255,0.1)',
    zIndex: 0,
  }
}));

const Login = () => {
    const theme = useTheme();
    const classes = useStyles();
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [user, setUser] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const { handleLogin, loading } = useContext(AuthContext);
    const [viewregister, setviewregister] = useState('disabled');

    const handleChangeInput = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        fetchviewregister();
    }, []);

    const fetchviewregister = async () => {
        try {
            const responsev = await api.get("/settings/viewregister");
            const viewregisterX = responsev?.data?.value;
            setviewregister(viewregisterX);
        } catch (error) {
            console.error('Error retrieving viewregister', error);
        }
    };

    const handlSubmit = (e) => {
        e.preventDefault();
        handleLogin(user);
    };

    const logo = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/login.png`;
    const randomValue = Math.random();
    const logoWithRandom = `${logo}?r=${randomValue}`;

    return (
        <div className={classes.root}>
            {/* Decorative circles */}
            <div className={classes.decorativeCircle} style={{ width: 300, height: 300, top: -150, left: -150 }} />
            <div className={classes.decorativeCircle} style={{ width: 200, height: 200, bottom: -100, right: -100 }} />
            
            <div className={classes.loginContainer}>
                <div className={classes.logoContainer}>
                    <img src={logoWithRandom} alt="Logo" />
                </div>
                
                <div className={classes.loginCard}>
                    <Typography variant="h5" className={classes.formTitle}>
                        Acesse sua conta
                    </Typography>
                    
                    <form className={classes.form} onSubmit={handlSubmit}>
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label={i18n.t("login.form.email")}
                            name="email"
                            value={user.email}
                            onChange={handleChangeInput}
                            autoComplete="email"
                            className={classes.inputField}
                            placeholder="seu@email.com"
                        />
                        
                        <TextField
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label={i18n.t("login.form.password")}
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={user.password}
                            onChange={handleChangeInput}
                            autoComplete="current-password"
                            className={classes.inputField}
                            placeholder="••••••••"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                            color={theme.palette.type === 'dark' ? 'default' : 'primary'}
                                        >
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submitButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                i18n.t("login.buttons.submit")
                            )}
                        </Button>
                        
                        <Grid container justifyContent="space-between">
                            <Grid item>
                                {viewregister === "enabled" && (
                                    <Link
                                        component={RouterLink}
                                        to="/signup"
                                        className={classes.linkText}
                                    >
                                        Criar conta
                                    </Link>
                                )}
                            </Grid>
                            <Grid item>
                                <Link
                                    component={RouterLink}
                                    to="/forgetpsw"
                                    className={classes.linkText}
                                >
                                    Esqueceu a senha?
                                </Link>
                            </Grid>
                        </Grid>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;