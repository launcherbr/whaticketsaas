import React, { useContext, useState, useEffect, useRef } from 'react';
import { useHistory } from "react-router-dom";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import {
  makeStyles,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
} from "@material-ui/core";
import { i18n } from "../../translate/i18n";
import { head } from "lodash";
import { ToastContainer, toast } from 'react-toastify';
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Title from "../Title";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import useSettings from "../../hooks/useSettings";
import { grey, blue } from "@material-ui/core/colors";
import { Tabs, Tab } from "@material-ui/core";
import ButtonWithSpinner from "../ButtonWithSpinner";


const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  mainPaper: {
    width: "100%",
    flex: 1,
    padding: theme.spacing(2),
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    background: "#f2f5f3",
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: "#128c7e"
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }


  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(1),
  },
  fullWidth: {
    width: "100%",
  },
  fileInput: {
  	background: "red",
  },
  fileInputLabel: {
    display: "inline-block",
    backgroundColor: "#7c7c7c",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    "& input": {
      display: "none",
    },
  },
}));

const Uploader = () => {
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { profile } = user;
  const history = useHistory();
  const [selectedFileName, setSelectedFileName] = useState('');

	

  // trava para nao acessar pagina que não pode 
  useEffect(() => {
    async function fetchData() {
      if (!user.super) {
        toast.error("Sem permissão para acessar!");
        setTimeout(() => {
          history.push(`/`)
        }, 500);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  const allowedTypes = ["image/png", "image/x-icon", "image/svg+xml"];
  
  if (selectedFile && allowedTypes.includes(selectedFile.type)) {
    setFile(selectedFile);
    setSelectedFileName(selectedFile.name);
  } else {
    setFile(null);
    setSelectedFileName(null);
    toast.error("Use somente arquivos em formato PNG, ICO ou SVG!");
  }
};

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.warn("Escolha um arquivo!");
      return;
    }

    if (!selectedOption) {
      toast.warn("Escolha um destino!");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post(`/settings/media-upload?ref=${selectedOption}`, formData);

      if (response.data.mensagem === 'Arquivo Anexado') {
        setUploaded(true);
        toast.success("Arquivo enviado com sucesso!");
        window.location.reload();

      }
    } catch (error) {
      console.log(error);
    }
  };

return (
  <>
    <Grid spacing={3} container>
      <Tabs
        indicatorColor="primary"
        textColor="primary"
        scrollButtons="on"
        variant="scrollable"
        className={classes.tab}
        style={{
          marginBottom: 20,
          marginTop: 20
        }}
      >
        <Tab label="Logotipos / Ícones" />
      </Tabs>

      <form onSubmit={handleSubmit} className={classes.fullWidth}>
      
      	<Grid item xs={12} sm={12} md={12} style={{ display: 'flex' }}>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="selectOption-label">Escolha uma opção:</InputLabel>
            <Select
              labelId="selectOption-label"
              value={selectedOption}
              onChange={handleOptionChange}
              style={{ marginTop: 15, marginBottom: 15}}
            >
              <MenuItem value="signup">Tela de Registro</MenuItem>
              <MenuItem value="login">Tela de Login</MenuItem>
              <MenuItem value="interno">Logotipo Interno</MenuItem>
	      <MenuItem value="logo_w">Logotipo Dark</MenuItem>
	      <MenuItem value="favicon">Favicon.Ico</MenuItem>
              {/*<MenuItem value="favicon-256x256">Ícone 256x256</MenuItem>
	      <MenuItem value="apple-touch-icon">Apple Touch Icon</MenuItem>*/}
            </Select>
          </FormControl>
        </Grid>


        <Grid item xs={12} sm={12} md={12} style={{ display: 'flex' }}>
  			<FormControl className={classes.fullWidth}>
   				<label className={classes.fileInputLabel}>
      			<input
        			type="file"
        			onChange={handleFileChange}
        			className={classes.fileInput}
                    style={{ marginTop: 15, marginBottom: 15 }}
      			/>
      			{selectedFileName ? selectedFileName : 'Escolher imagem em PNG'}
    			</label>
  			</FormControl>
		</Grid>
        
        <Grid item xs={12} sm={12} md={12} style={{ display: 'flex' }}>
          <ButtonWithSpinner
            type="submit"
            className={`${classes.fullWidth} ${classes.button}`}
            style={{ marginTop: 15, marginBottom: 15}}
            variant="contained"
            color="primary"
          >
            ENVIAR ARQUIVO
          </ButtonWithSpinner>
        </Grid>
      </form>
    </Grid>
  </>
);
};

export default Uploader;
