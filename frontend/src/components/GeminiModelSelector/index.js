import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  makeStyles,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Link,
  Chip
} from "@material-ui/core";
import InfoIcon from "@material-ui/icons/Info";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import api from "../../services/api";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    padding: theme.spacing(3),
    minWidth: 500,
  },
  modelCard: {
    marginBottom: theme.spacing(2),
    cursor: "pointer",
    border: "2px solid transparent",
    "&:hover": {
      borderColor: theme.palette.primary.main,
    },
    "&.selected": {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.primary.light + "10",
    },
  },
  modelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  modelName: {
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  modelDescription: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
  },
  infoBox: {
    backgroundColor: theme.palette.info.light + "20",
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing(2),
    display: "flex",
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.info.main,
  },
  linkButton: {
    marginTop: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  proChip: {
    backgroundColor: theme.palette.warning.main,
    color: "white",
  },
  freeChip: {
    backgroundColor: theme.palette.success.main,
    color: "white",
  },
}));

const GeminiModelSelector = ({ open, onClose, currentModel, companyId }) => {
  const classes = useStyles();
  const [selectedModel, setSelectedModel] = useState(currentModel || "gemini-2.0-flash-exp");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedModel(currentModel || "gemini-2.0-flash-exp");
    }
  }, [open, currentModel]);

  const models = [
    {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash",
      type: "FREE",
      description: "Versão atual recomendada. Única opção disponível neste ambiente.",
      consumption: "Gratuito até o limite da cota",
    },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/settings/geminiModel`, {
        value: selectedModel,
      });
      toast.success("Modelo do Gemini atualizado com sucesso!");
      onClose(true);
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Erro ao atualizar modelo do Gemini";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApiKeys = () => {
    window.open("https://aistudio.google.com/api-keys", "_blank");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Selecionar Modelo do Gemini</Typography>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {models.map((model) => (
              <Card
                key={model.id}
                className={`${classes.modelCard} ${
                  selectedModel === model.id ? "selected" : ""
                }`}
                onClick={() => setSelectedModel(model.id)}
              >
                <CardContent>
                  <Box className={classes.modelHeader}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Radio value={model.id} />
                      <Typography className={classes.modelName}>
                        {model.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={model.type}
                      size="small"
                      className={
                        model.type === "PRO"
                          ? classes.proChip
                          : classes.freeChip
                      }
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    className={classes.modelDescription}
                  >
                    {model.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {model.consumption}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </FormControl>

        <Box className={classes.infoBox}>
          <InfoIcon className={classes.infoIcon} />
          <Box>
            <Typography variant="body2" gutterBottom>
              <strong>Importante:</strong> Neste ambiente apenas o modelo Gemini 2.0 Flash está disponível.
            </Typography>
            <Typography variant="body2">
              Verifique periodicamente sua cota de uso na página de API Keys do Google.
            </Typography>
          </Box>
        </Box>

        <Box className={classes.linkButton}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenApiKeys}
            fullWidth
          >
            Acessar API Keys do Google
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeminiModelSelector;

