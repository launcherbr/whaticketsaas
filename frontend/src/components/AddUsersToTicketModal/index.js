import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Add as AddIcon, Close as CloseIcon } from "@material-ui/icons";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";

const AddUsersToTicketModal = ({ open, onClose, ticketId, currentUsers = [], ticket }) => {
  const [users, setUsers] = useState([]);
  const [queues, setQueues] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");

  useEffect(() => {
    if (open) {
      // Carregar filas
      const loadQueues = async () => {
        try {
          const { data } = await api.get("/queue");
          setQueues(data || []);
        } catch (err) {
          toastError(err);
        }
      };
      loadQueues();

      // Inicializar selectedUsers com os usuários atuais
      if (currentUsers && currentUsers.length > 0) {
        setSelectedUsers(currentUsers.map(u => ({
          userId: u.id,
          userName: u.name,
          queueId: u.TicketUser?.queueId || null,
          queueName: u.queue?.name || null
        })));
      } else {
        setSelectedUsers([]);
      }
    }
  }, [open, currentUsers]);

  useEffect(() => {
    if (open && searchParam.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchUsers();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchParam, open]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/users/", {
        params: { searchParam }
      });
      setUsers(data.users || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const handleAddUser = (user) => {
    if (user && !selectedUsers.find(u => u.userId === user.id)) {
      setSelectedUsers([...selectedUsers, {
        userId: user.id,
        userName: user.name,
        queueId: null,
        queueName: null
      }]);
      setSearchParam("");
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  const handleQueueChange = (userId, queueId) => {
    const queue = queues.find(q => q.id === queueId);
    setSelectedUsers(selectedUsers.map(u => 
      u.userId === userId 
        ? { ...u, queueId: queueId || null, queueName: queue ? queue.name : null }
        : u
    ));
  };

  const handleSave = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const ticketUsers = selectedUsers.map(u => ({
        userId: u.userId,
        queueId: u.queueId || null
      }));
      
      await api.put(`/tickets/${ticketId}`, {
        ticketUsers,
        status: "open"
      });
      toast.success("Usuários atualizados com sucesso!");
      onClose();
      window.location.reload();
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Adicionar Usuários ao Ticket</DialogTitle>
      <DialogContent>
        <Box style={{ marginBottom: 16 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => option.name || ""}
            loading={loading}
            inputValue={searchParam}
            onInputChange={(event, newInputValue) => {
              setSearchParam(newInputValue);
            }}
            onChange={(event, newValue) => {
              if (newValue) {
                handleAddUser(newValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar usuário"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>
        <Box>
          <strong>Usuários atribuídos:</strong>
          {selectedUsers.length === 0 ? (
            <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
              Nenhum usuário adicionado ainda
            </Typography>
          ) : (
            <Box style={{ marginTop: 16 }}>
              {selectedUsers.map((user) => (
                <Box 
                  key={user.userId} 
                  style={{ 
                    marginBottom: 16, 
                    padding: 12, 
                    border: "1px solid #e0e0e0", 
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <Box style={{ flex: 1 }}>
                    <Typography variant="body1" style={{ fontWeight: "bold", marginBottom: 8 }}>
                      {user.userName}
                    </Typography>
                    <FormControl variant="outlined" size="small" fullWidth>
                      <InputLabel>Fila para vincular ao grupo</InputLabel>
                      <Select
                        value={user.queueId || ""}
                        onChange={(e) => handleQueueChange(user.userId, e.target.value)}
                        label="Fila para vincular ao grupo"
                      >
                        <MenuItem value="">
                          <em>Nenhuma fila</em>
                        </MenuItem>
                        {queues.map((queue) => (
                          <MenuItem key={queue.id} value={queue.id}>
                            {queue.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Button
                    onClick={() => handleRemoveUser(user.userId)}
                    color="secondary"
                    style={{ marginLeft: 16 }}
                  >
                    <CloseIcon />
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={loading}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddUsersToTicketModal;
