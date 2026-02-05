import React, { useState, useContext, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Link as RouterLink, useHistory } from "react-router-dom";
import {
	Button,
	TextField,
	Typography,
	Grid,
	InputAdornment,
	IconButton,
	CircularProgress,
	CssBaseline,
	Container,
	Link,
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
	root: {
		minHeight: "100vh",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background:
			theme.palette.type === "dark"
				? "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)"
				: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
		position: "relative",
		overflow: "hidden",
		"&::before": {
			content: '""',
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			height: "50vh",
			background: theme.palette.primary.dark,
			borderBottomLeftRadius: "50% 20%",
			borderBottomRightRadius: "50% 20%",
			zIndex: 0,
		},
	},
	container: {
		position: "relative",
		width: "100%",
		maxWidth: 400,
		margin: theme.spacing(2),
		zIndex: 1,
	},
	card: {
		padding: theme.spacing(4, 3),
		borderRadius: 16,
		boxShadow: theme.shadows[4],
		background: theme.palette.background.paper,
		textAlign: "center",
		transition: "transform 0.3s, box-shadow 0.3s",
		"&:hover": {
			transform: "translateY(-5px)",
			boxShadow: theme.shadows[6],
		},
	},
	logoContainer: {
		width: 100,
		height: 100,
		margin: "0 auto -50px",
		borderRadius: "50%",
		background: theme.palette.primary.dark,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		boxShadow: theme.shadows[4],
		border: "4px solid " + (theme.palette.type === "dark" ? theme.palette.grey[900] : "white"),
		position: "relative",
		zIndex: 2,
		"& img": {
			width: "70%",
			height: "auto",
			filter: 'brightness(0) invert(1)',
		},
	},
	formTitle: {
		margin: theme.spacing(5, 0, 3),
		color: theme.palette.text.primary,
		fontWeight: 700,
	},
	form: {
		width: "100%",
		marginTop: theme.spacing(3),
	},
	inputField: {
		marginBottom: theme.spacing(2),
		"& .MuiOutlinedInput-root": {
			borderRadius: 8,
			backgroundColor: theme.palette.background.default,
			"& fieldset": {
				borderColor: theme.palette.divider,
			},
			"&:hover fieldset": {
				borderColor: theme.palette.primary.light,
			},
			"&.Mui-focused fieldset": {
				borderColor: theme.palette.primary.main,
				boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
			},
		},
		"& .MuiInputLabel-root": {
			color: theme.palette.text.secondary,
			"&.Mui-focused": {
				color: theme.palette.primary.main,
			},
		},
	},
	submitButton: {
		margin: theme.spacing(3, 0, 2),
		padding: theme.spacing(1.5),
		borderRadius: 8,
		fontWeight: 600,
		fontSize: "1rem",
		letterSpacing: 0.5,
		textTransform: "none",
		boxShadow: "none",
		transition: "all 0.2s",
		"&:hover": {
			transform: "translateY(-2px)",
			boxShadow: theme.shadows[4],
		},
		"&:active": {
			transform: "translateY(0)",
		},
	},
	linkText: {
		color: theme.palette.text.secondary,
		fontWeight: 500,
		textDecoration: "none",
		display: "inline-block",
		margin: theme.spacing(1, 0),
		transition: "color 0.2s",
		"&:hover": {
			color: theme.palette.primary.main,
		},
	},
}));

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const ForgetPassword = () => {
	const theme = useTheme();
	const classes = useStyles();
	const history = useHistory();
	const [showAdditionalFields, setShowAdditionalFields] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [viewregister, setviewregister] = useState("disabled");

	useEffect(() => {
		fetchviewregister();
	}, []);

	const fetchviewregister = async () => {
		try {
			const responsev = await api.get("/settings/viewregister");
			const viewregisterX = responsev?.data?.value;
			setviewregister(viewregisterX);
		} catch (error) {
			console.error("Error retrieving viewregister", error);
		}
	};

	const logo = `${process.env.REACT_APP_BACKEND_URL}/public/logotipos/login.png`;

	const handleSendEmail = async (values) => {
		setLoading(true);
		try {
			const response = await api.post(`${process.env.REACT_APP_BACKEND_URL}/forgetpassword/${values.email}`);
			if (response.data.status === 404) {
				toast.error("Email não encontrado");
			} else {
				toast.success(i18n.t("Email enviado com sucesso!"));
				setShowAdditionalFields(true);
			}
		} catch (err) {
			toastError(err);
		}
		setLoading(false);
	};

	const handleResetPassword = async (values) => {
		setLoading(true);
		try {
			await api.post(
				`${process.env.REACT_APP_BACKEND_URL}/resetpasswords/${values.email}/${values.token}/${values.newPassword}`
			);
			toast.success(i18n.t("Senha redefinida com sucesso."));
			history.push("/login");
		} catch (err) {
			toastError(err);
		}
		setLoading(false);
	};

	const UserSchema = Yup.object().shape({
		email: Yup.string().email("Email inválido").required("Campo obrigatório"),
		token: showAdditionalFields
			? Yup.string().required("Informe o código de verificação enviado ao seu email")
			: Yup.string(),
		newPassword: showAdditionalFields
			? Yup.string()
				.required("Campo obrigatório")
				.matches(
					passwordRegex,
					"Sua senha precisa ter no mínimo 8 caracteres, sendo uma letra maiúscula, uma minúscula e um número."
				)
			: Yup.string(),
		confirmPassword: Yup.string().when("newPassword", {
			is: (newPassword) => showAdditionalFields && newPassword,
			then: Yup.string()
				.oneOf([Yup.ref("newPassword"), null], "As senhas não correspondem")
				.required("Campo obrigatório"),
			otherwise: Yup.string(),
		}),
	});

	return (
		<div className={classes.root}>
			<div className={classes.container}>
				<div className={classes.logoContainer}>
					<img src={logo} alt="Logo" />
				</div>
				<div className={classes.card}>
					<Typography variant="h5" className={classes.formTitle}>
						Redefinir senha
					</Typography>
					<Formik
						initialValues={{
							email: "",
							token: "",
							newPassword: "",
							confirmPassword: "",
						}}
						validationSchema={UserSchema}
						onSubmit={(values) => {
							if (showAdditionalFields) {
								handleResetPassword(values);
							} else {
								handleSendEmail(values);
							}
						}}
					>
						{({ touched, errors }) => (
							<Form className={classes.form}>
								<Field
									as={TextField}
									variant="outlined"
									margin="normal"
									required
									fullWidth
									id="email"
									label="Email"
									name="email"
									autoComplete="email"
									className={classes.inputField}
									error={touched.email && Boolean(errors.email)}
									helperText={touched.email && errors.email}
								/>

								{showAdditionalFields && (
									<>
										<Field
											as={TextField}
											variant="outlined"
											margin="normal"
											required
											fullWidth
											id="token"
											label="Código de Verificação"
											name="token"
											className={classes.inputField}
											error={touched.token && Boolean(errors.token)}
											helperText={touched.token && errors.token}
										/>

										<Field
											as={TextField}
											variant="outlined"
											margin="normal"
											required
											fullWidth
											name="newPassword"
											label="Nova senha"
											type={showPassword ? "text" : "password"}
											id="newPassword"
											className={classes.inputField}
											error={touched.newPassword && Boolean(errors.newPassword)}
											helperText={touched.newPassword && errors.newPassword}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														<IconButton
															aria-label="toggle password visibility"
															onClick={() => setShowPassword((v) => !v)}
															edge="end"
															color={
																theme.palette.type === "dark" ? "default" : "primary"
															}
														>
															{showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
														</IconButton>
													</InputAdornment>
												),
											}}
										/>

										<Field
											as={TextField}
											variant="outlined"
											margin="normal"
											required
											fullWidth
											name="confirmPassword"
											label="Confirme a senha"
											type={showConfirmPassword ? "text" : "password"}
											id="confirmPassword"
											className={classes.inputField}
											error={touched.confirmPassword && Boolean(errors.confirmPassword)}
											helperText={touched.confirmPassword && errors.confirmPassword}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														<IconButton
															aria-label="toggle confirm password visibility"
															onClick={() => setShowConfirmPassword((v) => !v)}
															edge="end"
															color={
																theme.palette.type === "dark" ? "default" : "primary"
															}
														>
															{showConfirmPassword ? (
																<VisibilityIcon />
															) : (
																<VisibilityOffIcon />
															)}
														</IconButton>
													</InputAdornment>
												),
											}}
										/>
									</>
								)}

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
									) : showAdditionalFields ? (
										"Redefinir Senha"
									) : (
										"Enviar Email"
									)}
								</Button>

								<Grid container justifyContent="space-between">
									<Grid item>
										{viewregister === "enabled" && (
											<Link component={RouterLink} to="/signup" className={classes.linkText}>
												Não tem uma conta? Cadastre-se!
											</Link>
										)}
									</Grid>
									<Grid item>
										<Link component={RouterLink} to="/login" className={classes.linkText}>
											Voltar ao login
										</Link>
									</Grid>
								</Grid>
							</Form>
						)}
					</Formik>
				</div>
			</div>
		</div>
	);
};

export default ForgetPassword;
