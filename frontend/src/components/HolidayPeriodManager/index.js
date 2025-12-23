import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import { Add, Delete, Edit } from "@material-ui/icons";
import { toast } from "react-toastify";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  periodItem: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
}));

const HolidayPeriodManager = ({ whatsappId, companyId }) => {
  const classes = useStyles();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    message: "",
    active: true,
    repeatIntervalHours: 24,
  });

  useEffect(() => {
    if (whatsappId) {
      loadPeriods();
    }
  }, [whatsappId]);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/whatsapp/${whatsappId}/holiday-periods`);
      setPeriods(data);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (period = null) => {
    if (period) {
      setEditingPeriod(period);
      // Formata as datas para o input (YYYY-MM-DD) - usa UTC para evitar problemas de timezone
      const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        
        // Se já está no formato YYYY-MM-DD, retorna diretamente
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        // Se é string com timestamp ou Date, extrai usando UTC
        let date;
        if (dateValue instanceof Date) {
          date = dateValue;
        } else {
          date = new Date(dateValue);
        }
        
        // Usa UTC para evitar problemas de timezone
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      setFormData({
        startDate: formatDateForInput(period.startDate),
        endDate: formatDateForInput(period.endDate),
        message: period.message,
        active: period.active,
        repeatIntervalHours: period.repeatIntervalHours || 24,
      });
    } else {
      setEditingPeriod(null);
      setFormData({
        startDate: "",
        endDate: "",
        message: "",
        active: true,
        repeatIntervalHours: 24,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPeriod(null);
    setFormData({
      startDate: "",
      endDate: "",
      message: "",
      active: true,
      repeatIntervalHours: 24,
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.startDate || !formData.endDate || !formData.message) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error("A data de início deve ser anterior à data de término");
        return;
      }

      if (editingPeriod) {
        await api.put(
          `/whatsapp/${whatsappId}/holiday-periods/${editingPeriod.id}`,
          formData
        );
        toast.success("Período atualizado com sucesso!");
      } else {
        await api.post(`/whatsapp/${whatsappId}/holiday-periods`, formData);
        toast.success("Período criado com sucesso!");
      }

      handleCloseDialog();
      loadPeriods();
    } catch (err) {
      toastError(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este período?")) {
      return;
    }

    try {
      await api.delete(`/whatsapp/${whatsappId}/holiday-periods/${id}`);
      toast.success("Período excluído com sucesso!");
      loadPeriods();
    } catch (err) {
      toastError(err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    // Se já está no formato YYYY-MM-DD, converte diretamente
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isActivePeriod = (period) => {
    if (!period.active) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(period.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(period.endDate);
    endDate.setHours(23, 59, 59, 999);
    return today >= startDate && today <= endDate;
  };

  return (
    <Box>
      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recesso/Feriados</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Adicionar Período
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : periods.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            Nenhum período de recesso/feriado configurado
          </Typography>
        ) : (
          periods.map((period) => (
            <Paper key={period.id} className={classes.periodItem}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="textSecondary">
                    De: {formatDate(period.startDate)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Até: {formatDate(period.endDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" noWrap>
                    {period.message.substring(0, 50)}
                    {period.message.length > 50 ? "..." : ""}
                  </Typography>
                  {isActivePeriod(period) && (
                    <Typography variant="caption" color="primary">
                      ⚠️ Período ativo agora
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={period.active}
                          onChange={async (e) => {
                            try {
                              await api.put(
                                `/whatsapp/${whatsappId}/holiday-periods/${period.id}`,
                                { 
                                  ...period, 
                                  active: e.target.checked,
                                  repeatIntervalHours: period.repeatIntervalHours || 24
                                }
                              );
                              loadPeriods();
                            } catch (err) {
                              toastError(err);
                            }
                          }}
                        />
                      }
                      label={period.active ? "Ativo" : "Inativo"}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(period)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(period.id)}
                      color="secondary"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPeriod ? "Editar Período" : "Novo Período de Recesso/Feriado"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Início"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Término"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                margin="dense"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensagem"
                multiline
                rows={4}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                margin="dense"
                variant="outlined"
                placeholder="Ex.: Estamos em recesso de {{startDate}} a {{endDate}}. Retornaremos em breve!"
                helperText="Variáveis disponíveis: {{startDate}} (data de início), {{endDate}} (data de término), {{name}} (nome do contato), {{ms}} (saudação)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>Repetir mensagem a cada (horas)</InputLabel>
                <Select
                  value={formData.repeatIntervalHours}
                  onChange={(e) =>
                    setFormData({ ...formData, repeatIntervalHours: e.target.value })
                  }
                  label="Repetir mensagem a cada (horas)"
                >
                  <MenuItem value={1}>1 hora</MenuItem>
                  <MenuItem value={2}>2 horas</MenuItem>
                  <MenuItem value={3}>3 horas</MenuItem>
                  <MenuItem value={6}>6 horas</MenuItem>
                  <MenuItem value={12}>12 horas</MenuItem>
                  <MenuItem value={24}>24 horas (1 dia)</MenuItem>
                  <MenuItem value={48}>48 horas (2 dias)</MenuItem>
                  <MenuItem value={72}>72 horas (3 dias)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                  />
                }
                label="Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidayPeriodManager;

