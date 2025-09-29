import React, { useContext, useEffect, useReducer, useState } from "react";

import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography // Importar Typography do Material-UI
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { DeleteOutline, Edit } from "@material-ui/icons";
import PromptModal from "../../components/PromptModal";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { SocketContext } from "../../context/Socket/SocketContext";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Adicione um estilo para a box vermelha
  redBox: {
    backgroundColor: "#ffcccc", // Definindo a cor de fundo vermelha
    padding: theme.spacing(2), // Adicionando um espaçamento interno
    marginBottom: theme.spacing(2), // Adicionando margem inferior para separar do conteúdo abaixo
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_PROMPTS") {
    const prompts = action.payload;
    const newPrompts = [];

    prompts.forEach((prompt) => {
      const promptIndex = state.findIndex((p) => p.id === prompt.id);
      if (promptIndex !== -1) {
        state[promptIndex] = prompt;
      } else {
        newPrompts.push(prompt);
      }
    });

    return [...state, ...newPrompts];
  }

  if (action.type === "UPDATE_PROMPTS") {
    const prompt = action.payload;
    const promptIndex = state.findIndex((p) => p.id === prompt.id);

    if (promptIndex !== -1) {
      state[promptIndex] = prompt;
      return [...state];
    } else {
      return [prompt, ...state];
    }
  }

  if (action.type === "DELETE_PROMPT") {
    const promptId = action.payload;
    const promptIndex = state.findIndex((p) => p.id === promptId);
    if (promptIndex !== -1) {
      state.splice(promptIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Prompts = () => {
  const classes = useStyles();

  const [prompts, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const history = useHistory();
  const companyId = user.companyId;

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useOpenAi) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/prompt");
        dispatch({ type: "LOAD_PROMPTS", payload: data.prompts });

        setLoading(false);
      } catch (err) {
        toastError(err);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-prompt`, (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_PROMPTS", payload: data.prompt });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_PROMPT", payload: data.promptId });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [companyId, socketManager]);

  const handleOpenPromptModal = () => {
    setPromptModalOpen(true);
    setSelectedPrompt(null);
  };

  const handleClosePromptModal = () => {
    setPromptModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleEditPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setPromptModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      const { data } = await api.delete(`/prompt/${promptId}`);
      toast.info(i18n.t(data.message));
    } catch (err) {
      toastError(err);
    }
    setSelectedPrompt(null);
  };

  return (
    <MainContainer>
      {/* Box vermelha com o aviso */}
      <Paper className={classes.redBox} variant="outlined">
        <Typography variant="body1">
          <strong>Aviso Importante:</strong> Para todos os usuários do Whaticket que notaram uma interrupção no funcionamento do OpenAI, gostaríamos de esclarecer que isso não se trata de um erro do sistema. O OpenAI oferece um crédito gratuito de $5 USD para novos cadastros, porém, este benefício também está sujeito a um limite de tempo, geralmente em torno de três meses. Quando o crédito disponibilizado se esgota, é necessário recarregar a conta para continuar utilizando o serviço. É importante estar ciente dessa política para garantir uma experiência contínua e sem interrupções no uso do OpenAI com o Whaticket. Se você notou que o serviço parou de funcionar, verifique se seu crédito gratuito expirou e considere a recarga da conta, se necessário. Estamos à disposição para ajudar e esclarecer quaisquer dúvidas adicionais que possam surgir. Obrigado pela compreensão e continuaremos trabalhando para oferecer o melhor serviço possível aos nossos usuários.
        </Typography>
        {/* Links úteis */}
        <Typography variant="body1">
          <strong>Links Úteis:</strong>
          <br />
          Uso: <a href="https://platform.openai.com/usage">https://platform.openai.com/usage</a>
          <br />
          Fatura: <a href="https://platform.openai.com/account/billing/overview">https://platform.openai.com/account/billing/overview</a>
          <br />
          API: <a href="https://platform.openai.com/api-keys">https://platform.openai.com/api-keys</a>
        </Typography>
      </Paper>
      {/* Fim da box vermelha */}

      <ConfirmationModal
        title={
          selectedPrompt &&
          `${i18n.t("prompts.confirmationModal.deleteTitle")} ${selectedPrompt.name
          }?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeletePrompt(selectedPrompt.id)}
      >
        {i18n.t("prompts.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <PromptModal
        open={promptModalOpen}
        onClose={handleClosePromptModal}
        promptId={selectedPrompt?.id}
      />
      <MainHeader>
        <Title>{i18n.t("prompts.title")}</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenPromptModal}
          >
            {i18n.t("prompts.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">
                {i18n.t("prompts.table.name")}
              </TableCell>
              <TableCell align="left">
                {i18n.t("prompts.table.queue")}
              </TableCell>
              <TableCell align="left">
                {i18n.t("prompts.table.max_tokens")}
              </TableCell>
              <TableCell align="center">
                {i18n.t("prompts.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {prompts.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell align="left">{prompt.name}</TableCell>
                  <TableCell align="left">{prompt.queue.name}</TableCell>
                  <TableCell align="left">{prompt.maxTokens}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEditPrompt(prompt)}
                    >
                      <Edit />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setConfirmModalOpen(true);
                      }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={4} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </MainContainer>
  );
};

export default Prompts;
