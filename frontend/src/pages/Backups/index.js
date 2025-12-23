import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import {
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Storage as BackupIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(3),
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  createButton: {
    backgroundColor: theme.palette.primary.main,
    color: "white",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  alertBox: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
  },
  table: {
    minWidth: 650,
  },
  progressContainer: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
  },
  progressBar: {
    marginTop: theme.spacing(1),
  },
  progressText: {
    marginTop: theme.spacing(1),
    textAlign: "center",
  },
  sizeCell: {
    whiteSpace: "nowrap",
  },
  searchBox: {
    marginBottom: theme.spacing(2),
  },
  pagination: {
    marginTop: theme.spacing(2),
    display: "flex",
    justifyContent: "center",
  },
}));

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("pt-BR");
};

const Backups = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, backup: null });
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchParam, setSearchParam] = useState("");

  useEffect(() => {
    if (!user.super) {
      toast.error("Acesso negado. Apenas superadmin pode acessar esta página.");
      setTimeout(() => {
        history.push("/");
      }, 1000);
      return;
    }
  }, [user, history]);

  useEffect(() => {
    loadBackups();
  }, [page, searchParam]);

  useEffect(() => {
    if (!socketManager) return;

    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.getSocket(companyId);

    socket.on("backup-progress", (data) => {
      setBackupProgress(data);
      if (data.status === "completed" || data.status === "error") {
        setCreatingBackup(false);
        if (data.status === "completed") {
          toast.success("Backup concluído com sucesso!");
          loadBackups();
        } else {
          toast.error(`Erro ao criar backup: ${data.error || "Erro desconhecido"}`);
        }
        setTimeout(() => {
          setBackupProgress(null);
        }, 3000);
      }
    });

    return () => {
      socket.off("backup-progress");
    };
  }, [socketManager]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/backups", {
        params: {
          pageNumber: page,
          searchParam: searchParam,
        },
      });
      setBackups(data.backups || []);
      setCount(data.count || 0);
      setHasMore(data.hasMore || false);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setBackupProgress({ progress: 0, status: "started" });
      await api.post("/backups");
      toast.info("Backup iniciado. Aguarde a conclusão...");
    } catch (err) {
      toastError(err);
      setCreatingBackup(false);
      setBackupProgress(null);
    }
  };

  const handleDownload = async (backupId) => {
    try {
      const response = await api.get(`/backups/${backupId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${backupId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download iniciado");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDeleteClick = (backup) => {
    setDeleteDialog({ open: true, backup });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/backups/${deleteDialog.backup.id}`);
      toast.success("Backup excluído com sucesso");
      setDeleteDialog({ open: false, backup: null });
      loadBackups();
    } catch (err) {
      toastError(err);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getStatusMessage = (status) => {
    const messages = {
      started: "Iniciando...",
      preparing: "Preparando...",
      database: "Fazendo backup do banco de dados...",
      backend: "Copiando arquivos do backend...",
      frontend: "Copiando arquivos do frontend...",
      compressing: "Comprimindo arquivos...",
      completed: "Concluído!",
      error: "Erro ao criar backup",
    };
    return messages[status] || status;
  };

  if (!user.super) {
    return null;
  }

  return (
    <div className={classes.root}>
      <Box className={classes.header}>
        <Typography className={classes.title}>Backups do Sistema</Typography>
        <Button
          variant="contained"
          className={classes.createButton}
          startIcon={<BackupIcon />}
          onClick={handleCreateBackup}
          disabled={creatingBackup}
        >
          Fazer Backup
        </Button>
      </Box>

      <Alert severity="info" className={classes.alertBox} icon={<WarningIcon />}>
        <Typography variant="body2">
          <strong>Importante:</strong> É sempre recomendado fazer backup da VPS através de snapshot
          e também realizar backups regularmente durante a noite devido à duração do processo.
          Os backups incluem o banco de dados completo e todos os arquivos do sistema (backend e frontend).
        </Typography>
      </Alert>

      {creatingBackup && backupProgress && (
        <Paper className={classes.progressContainer}>
          <Typography variant="h6">Criando Backup...</Typography>
          <LinearProgress
            variant="determinate"
            value={backupProgress.progress}
            className={classes.progressBar}
          />
          <Typography className={classes.progressText}>
            {backupProgress.progress}% - {getStatusMessage(backupProgress.status)}
          </Typography>
          {backupProgress.error && (
            <Typography color="error" className={classes.progressText}>
              Erro: {backupProgress.error}
            </Typography>
          )}
        </Paper>
      )}

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar backups..."
        value={searchParam}
        onChange={(e) => {
          setSearchParam(e.target.value);
          setPage(1);
        }}
        className={classes.searchBox}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Paper>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Tamanho</TableCell>
              <TableCell>Data de Criação</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : backups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography>Nenhum backup encontrado</Typography>
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell>{backup.name}</TableCell>
                  <TableCell className={classes.sizeCell}>
                    {formatBytes(backup.size)}
                  </TableCell>
                  <TableCell>{formatDate(backup.createdAt)}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => handleDownload(backup.id)}
                      title="Download"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleDeleteClick(backup)}
                      title="Excluir"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {count > 0 && (
        <Box className={classes.pagination}>
          <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              disabled={page === 1}
              onClick={() => handlePageChange(null, page - 1)}
            >
              Anterior
            </Button>
            <Typography>
              Página {page} de {Math.ceil(count / 10)}
            </Typography>
            <Button
              variant="outlined"
              disabled={!hasMore}
              onClick={() => handlePageChange(null, page + 1)}
            >
              Próxima
            </Button>
          </Box>
        </Box>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, backup: null })}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o backup "{deleteDialog.backup?.name}"?
            Esta ação não afetará o sistema, apenas removerá o arquivo de backup.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, backup: null })}
            color="primary"
          >
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="secondary" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Backups;


