import React, { useEffect, useState } from "react";

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
import api from "../../services/api";
import { ToastContainer, toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { Tabs, Tab, Button as MuiButton } from "@material-ui/core";
import OnlyForSuperUser from '../../components/OnlyForSuperUser';
import useAuth from '../../hooks/useAuth.js';
import GeminiModelSelector from '../GeminiModelSelector';

//import 'react-toastify/dist/ReactToastify.css';
 
const useStyles = makeStyles((theme) => ({
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
    backgroundColor: theme.palette.options,  //DARK MODE//
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: theme.palette.fontecor,
    },   //DARK MODE//
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
}));

export default function Options(props) {
  const { settings, scheduleTypeChanged } = props;
  const classes = useStyles();

  const [currentUser, setCurrentUser] = useState({});
  const { getCurrentUserInfo } = useAuth();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function findData() {
      setLoading(true);
      try {
        const user = await getCurrentUserInfo();
        setCurrentUser(user);
      } catch (e) {
        toast.error(e);
      }
      setLoading(false);
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuper = () => {
    return currentUser.super;
  }; 

  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [callType, setCallType] = useState("enabled");
  const [chatbotType, setChatbotType] = useState("");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingCheckMsgIsGroup, setCheckMsgIsGroup] = useState(false);


  const [viewclosed, setviewclosed] = useState('disabled');
  const [loadingviewclosed, setLoadingviewclosed] = useState(false);

  const [viewgroups, setviewgroups] = useState('disabled');
  const [loadingviewgroups, setLoadingviewgroups] = useState(false);    

  const [ipixcType, setIpIxcType] = useState("");
  const [loadingIpIxcType, setLoadingIpIxcType] = useState(false);
  const [tokenixcType, setTokenIxcType] = useState("");
  const [loadingTokenIxcType, setLoadingTokenIxcType] = useState(false);

  const [ipmkauthType, setIpMkauthType] = useState("");
  const [loadingIpMkauthType, setLoadingIpMkauthType] = useState(false);
  const [clientidmkauthType, setClientIdMkauthType] = useState("");
  const [loadingClientIdMkauthType, setLoadingClientIdMkauthType] = useState(false);
  const [clientsecretmkauthType, setClientSecrectMkauthType] = useState("");
  const [loadingClientSecrectMkauthType, setLoadingClientSecrectMkauthType] = useState(false);

  const [asaasType, setAsaasType] = useState("");
  const [loadingAsaasType, setLoadingAsaasType] = useState(false);

  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState("");
  const [loadingMercadoPagoPublicKey, setLoadingMercadoPagoPublicKey] = useState(false);
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState("");
  const [loadingMercadoPagoAccessToken, setLoadingMercadoPagoAccessToken] = useState(false);
  const [mercadoPagoWebhookSecret, setMercadoPagoWebhookSecret] = useState("");
  const [loadingMercadoPagoWebhookSecret, setLoadingMercadoPagoWebhookSecret] = useState(false);
  const [subscriptionPaymentProvider, setSubscriptionPaymentProvider] = useState("gerencianet");
  const [loadingSubscriptionPaymentProvider, setLoadingSubscriptionPaymentProvider] = useState(false);

  const [geminiApiToken, setGeminiApiToken] = useState("");
  const [loadingGeminiApiToken, setLoadingGeminiApiToken] = useState(false);
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash-exp");
  const [showGeminiModelSelector, setShowGeminiModelSelector] = useState(false);

  
  // recursos a mais...
  const [trial, settrial] = useState('3');
  const [loadingtrial, setLoadingtrial] = useState(false);

  const [viewregister, setviewregister] = useState('disabled');
  const [loadingviewregister, setLoadingviewregister] = useState(false);

  const [allowregister, setallowregister] = useState('disabled');
  const [loadingallowregister, setLoadingallowregister] = useState(false);

  const [SendGreetingAccepted, setSendGreetingAccepted] = useState("disabled");
  const [loadingSendGreetingAccepted, setLoadingSendGreetingAccepted] = useState(false);
  const [sendGreetingAcceptedMessage, setSendGreetingAcceptedMessage] = useState("");
  const [savingGreetingMessage, setSavingGreetingMessage] = useState(false);
  
  const [birthdayReminderEnabled, setBirthdayReminderEnabled] = useState("disabled");
  const [loadingBirthdayReminderEnabled, setLoadingBirthdayReminderEnabled] = useState(false);
  const [birthdayMessage, setBirthdayMessage] = useState("");
  const [savingBirthdayMessage, setSavingBirthdayMessage] = useState(false);
  const [birthdayReminderTime, setBirthdayReminderTime] = useState("09:00");
  const [savingBirthdayReminderTime, setSavingBirthdayReminderTime] = useState(false);
  
  const [holidayPeriodEnabled, setHolidayPeriodEnabled] = useState("disabled");
  const [loadingHolidayPeriodEnabled, setLoadingHolidayPeriodEnabled] = useState(false);
  const [holidayPeriodAllowQueueFlow, setHolidayPeriodAllowQueueFlow] = useState("disabled");
  const [loadingHolidayPeriodAllowQueueFlow, setLoadingHolidayPeriodAllowQueueFlow] = useState(false);
  
  const [SettingsTransfTicket, setSettingsTransfTicket] = useState("disabled");
  const [loadingSettingsTransfTicket, setLoadingSettingsTransfTicket] = useState(false);
  const [sendMsgTransfTicketMessage, setSendMsgTransfTicketMessage] = useState("");
  const [savingTransferMessage, setSavingTransferMessage] = useState(false);

  const [gerencianetSandbox, setGerencianetSandbox] = useState("false");
  const [loadingGerencianetSandbox, setLoadingGerencianetSandbox] = useState(false);
  const [gerencianetClientId, setGerencianetClientId] = useState("");
  const [loadingGerencianetClientId, setLoadingGerencianetClientId] = useState(false);
  const [gerencianetClientSecret, setGerencianetClientSecret] = useState("");
  const [loadingGerencianetClientSecret, setLoadingGerencianetClientSecret] = useState(false);
  const [gerencianetPixCert, setGerencianetPixCert] = useState("");
  const [uploadingGerencianetCert, setUploadingGerencianetCert] = useState(false);
  const [gerencianetPixKey, setGerencianetPixKey] = useState("");
  const [loadingGerencianetPixKey, setLoadingGerencianetPixKey] = useState(false);
  const [gerencianetWebhookUrl, setGerencianetWebhookUrl] = useState("");
  const [validatingWebhook, setValidatingWebhook] = useState(false);
  const [webhookValidationResult, setWebhookValidationResult] = useState(null);

  // Inicializa URL do webhook com valor padrão
  useEffect(() => {
    if (!gerencianetWebhookUrl) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 
        (window.location.origin.includes('localhost') 
          ? 'http://localhost:3000' 
          : window.location.origin.replace(':3001', ':3000'));
      const defaultWebhookUrl = `${backendUrl}/subscription/webhook`;
      setGerencianetWebhookUrl(defaultWebhookUrl);
    }
  }, []);

  const [sendGreetingMessageOneQueues, setSendGreetingMessageOneQueues] = useState("disabled");
  const [loadingSendGreetingMessageOneQueues, setLoadingSendGreetingMessageOneQueues] = useState(false);

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      }
      const scheduleType = settings.find((s) => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType.value);
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }

      const allowregister = settings.find((s) => s.key === 'allowregister');
      if (allowregister) {
        setallowregister(allowregister.value);
      }

      const viewclosed = settings.find((s) => s.key === 'viewclosed');
      if (viewclosed) {
        setviewclosed(viewclosed.value);
      }

      const viewgroups = settings.find((s) => s.key === 'viewgroups');
      if (viewgroups) {
        setviewgroups(viewgroups.value);
      }
      
	  {/*SAUDAÇÃO*/}
      const SendGreetingAccepted = settings.find((s) => s.key === "sendGreetingAccepted");
      if (SendGreetingAccepted) {
        setSendGreetingAccepted(SendGreetingAccepted.value);
      }	 
	  {/*SAUDAÇÃO*/}	 
	  
	  {/*TRANSFERIR TICKET*/}	
	  const SettingsTransfTicket = settings.find((s) => s.key === "sendMsgTransfTicket");
      if (SettingsTransfTicket) {
        setSettingsTransfTicket(SettingsTransfTicket.value);
      }
	  {/*TRANSFERIR TICKET*/}

      const settingsTransfTicketMessage = settings.find((s) => s.key === "sendMsgTransfTicketMessage");
      if (settingsTransfTicketMessage) {
        setSendMsgTransfTicketMessage(settingsTransfTicketMessage.value);
      }

      const sendGreetingAccepted = settings.find((s) => s.key === "sendGreetingAccepted");
      if (sendGreetingAccepted) {
        setSendGreetingAccepted(sendGreetingAccepted.value);
      }

      const sendGreetingAcceptedMsg = settings.find((s) => s.key === "sendGreetingAcceptedMessage");
      if (sendGreetingAcceptedMsg) {
        setSendGreetingAcceptedMessage(sendGreetingAcceptedMsg.value);
      }

      const birthdayReminderSetting = settings.find((s) => s.key === "birthdayReminderEnabled");
      if (birthdayReminderSetting) {
        setBirthdayReminderEnabled(birthdayReminderSetting.value);
      }

      const birthdayMessageSetting = settings.find((s) => s.key === "birthdayMessage");
      if (birthdayMessageSetting) {
        setBirthdayMessage(birthdayMessageSetting.value);
      }

      const birthdayReminderTimeSetting = settings.find((s) => s.key === "birthdayReminderTime");
      if (birthdayReminderTimeSetting) {
        setBirthdayReminderTime(birthdayReminderTimeSetting.value || "09:00");
      }

      const holidayPeriodEnabledSetting = settings.find((s) => s.key === "holidayPeriodEnabled");
      if (holidayPeriodEnabledSetting) {
        setHolidayPeriodEnabled(holidayPeriodEnabledSetting.value);
      }

      const holidayPeriodAllowQueueFlowSetting = settings.find((s) => s.key === "holidayPeriodAllowQueueFlow");
      if (holidayPeriodAllowQueueFlowSetting) {
        setHolidayPeriodAllowQueueFlow(holidayPeriodAllowQueueFlowSetting.value);
      }

      const gerencianetSandboxSetting = settings.find((s) => s.key === "gerencianetSandbox");
      if (gerencianetSandboxSetting) {
        setGerencianetSandbox(gerencianetSandboxSetting.value);
      }

      const gerencianetClientIdSetting = settings.find((s) => s.key === "gerencianetClientId");
      if (gerencianetClientIdSetting) {
        setGerencianetClientId(gerencianetClientIdSetting.value);
      }

      const gerencianetClientSecretSetting = settings.find((s) => s.key === "gerencianetClientSecret");
      if (gerencianetClientSecretSetting) {
        setGerencianetClientSecret(gerencianetClientSecretSetting.value);
      }

      const gerencianetPixCertSetting = settings.find((s) => s.key === "gerencianetPixCert");
      if (gerencianetPixCertSetting) {
        setGerencianetPixCert(gerencianetPixCertSetting.value);
      }

      const gerencianetPixKeySetting = settings.find((s) => s.key === "gerencianetPixKey");
      if (gerencianetPixKeySetting) {
        setGerencianetPixKey(gerencianetPixKeySetting.value);
      }

      const viewregister = settings.find((s) => s.key === 'viewregister');
      if (viewregister) {
        setviewregister(viewregister.value);
      }

      const sendGreetingMessageOneQueues = settings.find((s) => s.key === "sendGreetingMessageOneQueues");
      if (sendGreetingMessageOneQueues) {
        setSendGreetingMessageOneQueues(sendGreetingMessageOneQueues.value)
      }	  
	  
      const chatbotType = settings.find((s) => s.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType.value);
      }
	  
	  const trial = settings.find((s) => s.key === 'trial');
      if (trial) {
        settrial(trial.value);
      }

      const ipixcType = settings.find((s) => s.key === "ipixc");
      if (ipixcType) {
        setIpIxcType(ipixcType.value);
      }

      const tokenixcType = settings.find((s) => s.key === "tokenixc");
      if (tokenixcType) {
        setTokenIxcType(tokenixcType.value);
      }

      const ipmkauthType = settings.find((s) => s.key === "ipmkauth");
      if (ipmkauthType) {
        setIpMkauthType(ipmkauthType.value);
      }

      const clientidmkauthType = settings.find((s) => s.key === "clientidmkauth");
      if (clientidmkauthType) {
        setClientIdMkauthType(clientidmkauthType.value);
      }

      const clientsecretmkauthType = settings.find((s) => s.key === "clientsecretmkauth");
      if (clientsecretmkauthType) {
        setClientSecrectMkauthType(clientsecretmkauthType.value);
      }

      const asaasType = settings.find((s) => s.key === "asaas");
      if (asaasType) {
        setAsaasType(asaasType.value);
      }

      const mercadoPagoPublicKeySetting = settings.find((s) => s.key === "mercadoPagoPublicKey");
      if (mercadoPagoPublicKeySetting) {
        setMercadoPagoPublicKey(mercadoPagoPublicKeySetting.value);
      }

      const mercadoPagoAccessTokenSetting = settings.find((s) => s.key === "mercadoPagoAccessToken");
      if (mercadoPagoAccessTokenSetting) {
        setMercadoPagoAccessToken(mercadoPagoAccessTokenSetting.value);
      }

      const mercadoPagoWebhookSecretSetting = settings.find((s) => s.key === "mercadoPagoWebhookSecret");
      if (mercadoPagoWebhookSecretSetting) {
        setMercadoPagoWebhookSecret(mercadoPagoWebhookSecretSetting.value);
      }

      const paymentProviderSetting = settings.find((s) => s.key === "subscriptionPaymentProvider");
      if (paymentProviderSetting) {
        setSubscriptionPaymentProvider(paymentProviderSetting.value);
      } else {
        setSubscriptionPaymentProvider("gerencianet");
      }

      const geminiApiToken = settings.find((s) => s.key === "geminiApiToken");
      if (geminiApiToken) {
        setGeminiApiToken(geminiApiToken.value);
      }

      const geminiModel = settings.find((s) => s.key === "geminiModel");
      if (geminiModel) {
        setGeminiModel(geminiModel.value);
      } else {
        setGeminiModel("gemini-2.0-flash-exp");
      }

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingUserRating(false);
  }

  async function handleallowregister(value) {
    setallowregister(value);
    setLoadingallowregister(true);
    await update({
      key: 'allowregister',
      value,
    });
    toast.success('Operação atualizada com sucesso.');
    setLoadingallowregister(false);
  }
 
  
  async function handleviewclosed(value) {
    setviewclosed(value);
    setLoadingviewclosed(true);
    await update({
      key: 'viewclosed',
      value,
    });
    toast.success('Operação atualizada com sucesso.');
    setLoadingviewclosed(false);
  }

  async function handleviewgroups(value) {
    setviewgroups(value);
    setLoadingviewgroups(true);
    await update({
      key: 'viewgroups',
      value,
    });
    toast.success('Operação atualizada com sucesso.');
    setLoadingviewgroups(false);
  }
    async function handleSendGreetingMessageOneQueues(value) {
    setSendGreetingMessageOneQueues(value);
    setLoadingSendGreetingMessageOneQueues(true);
    await update({
      key: "sendGreetingMessageOneQueues",
      value,
    });
	toast.success("Operação atualizada com sucesso.");
    setLoadingSendGreetingMessageOneQueues(false);
  }

  async function handleviewregister(value) {
    setviewregister(value);
    setLoadingviewregister(true);
    await update({
      key: 'viewregister',
      value,
    });
    toast.success('Operação atualizada com sucesso.');
    setLoadingviewregister(false);
  }
  
    async function handletrial(value) {
    settrial(value);
    setLoadingtrial(true);
    await update({
      key: 'trial',
      value,
    });
    toast.success('Operação atualizada com sucesso.');
    setLoadingtrial(false);
  }


  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      key: "scheduleType",
      value,
    });
    //toast.success("Oraçãpeo atualizada com sucesso.");
    toast.success('Operação atualizada com sucesso.', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      theme: "light",
      });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    setLoadingCallType(true);
    await update({
      key: "call",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingCallType(false);
  }

  async function handleChatbotType(value) {
    setChatbotType(value);
    setLoadingChatbotType(true);
    await update({
      key: "chatBotType",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingChatbotType(false);
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    setCheckMsgIsGroup(true);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setCheckMsgIsGroupType(false);
    /*     if (typeof scheduleTypeChanged === "function") {
          scheduleTypeChanged(value);
        } */
  }
  
  {/*NOVO CÓDIGO*/}  
  async function handleSendGreetingAccepted(value) {
    setSendGreetingAccepted(value);
    setLoadingSendGreetingAccepted(true);
    await update({
      key: "sendGreetingAccepted",
      value,
    });
	toast.success("Operação atualizada com sucesso.");
    setLoadingSendGreetingAccepted(false);
  }  
  
  
  {/*NOVO CÓDIGO*/}    

  async function handleSettingsTransfTicket(value) {
    setSettingsTransfTicket(value);
    setLoadingSettingsTransfTicket(true);
    await update({
      key: "sendMsgTransfTicket",
      value,
    });

    toast.success("Operação atualizada com sucesso.");
    setLoadingSettingsTransfTicket(false);
  } 

  async function handleSaveTransferMessage() {
    setSavingTransferMessage(true);
    await update({
      key: "sendMsgTransfTicketMessage",
      value: sendMsgTransfTicketMessage,
    });
    toast.success("Mensagem de transferência atualizada com sucesso.");
    setSavingTransferMessage(false);
  }

  async function handleSaveGreetingMessage() {
    setSavingGreetingMessage(true);
    await update({
      key: "sendGreetingAcceptedMessage",
      value: sendGreetingAcceptedMessage,
    });
    toast.success("Mensagem de saudação atualizada com sucesso.");
    setSavingGreetingMessage(false);
  }

  async function handleHolidayPeriodEnabled(value) {
    setHolidayPeriodEnabled(value);
    setLoadingHolidayPeriodEnabled(true);
    await update({
      key: "holidayPeriodEnabled",
      value,
    });
    toast.success("Mensagem de recesso/feriados atualizada com sucesso.");
    setLoadingHolidayPeriodEnabled(false);
  }

  async function handleHolidayPeriodAllowQueueFlow(value) {
    setHolidayPeriodAllowQueueFlow(value);
    setLoadingHolidayPeriodAllowQueueFlow(true);
    await update({
      key: "holidayPeriodAllowQueueFlow",
      value,
    });
    toast.success("Configuração de fluxo durante recesso atualizada com sucesso.");
    setLoadingHolidayPeriodAllowQueueFlow(false);
  }

  async function handleBirthdayReminderEnabled(value) {
    setBirthdayReminderEnabled(value);
    setLoadingBirthdayReminderEnabled(true);
    await update({
      key: "birthdayReminderEnabled",
      value,
    });
    toast.success("Aviso de aniversariantes atualizado com sucesso.");
    setLoadingBirthdayReminderEnabled(false);
  }

  async function handleSaveBirthdayMessage() {
    setSavingBirthdayMessage(true);
    await update({
      key: "birthdayMessage",
      value: birthdayMessage,
    });
    toast.success("Mensagem de aniversário atualizada com sucesso.");
    setSavingBirthdayMessage(false);
  }

  async function handleSaveBirthdayReminderTime() {
    setSavingBirthdayReminderTime(true);
    await update({
      key: "birthdayReminderTime",
      value: birthdayReminderTime,
    });
    toast.success("Horário de disparo de aniversários atualizado com sucesso. O sistema será reiniciado para aplicar as mudanças.");
    setSavingBirthdayReminderTime(false);
  }
 
  async function handleChangeIPIxc(value) {
    setIpIxcType(value);
    setLoadingIpIxcType(true);
    await update({
      key: "ipixc",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingIpIxcType(false);
  }

  async function handleChangeGerencianetSandbox(value) {
    setGerencianetSandbox(value);
    setLoadingGerencianetSandbox(true);
    await update({
      key: "gerencianetSandbox",
      value,
    });
    toast.success("Ambiente Gerencianet atualizado com sucesso.");
    setLoadingGerencianetSandbox(false);
  }

  async function handleChangeGerencianetClientId(value) {
    setGerencianetClientId(value);
    setLoadingGerencianetClientId(true);
    await update({
      key: "gerencianetClientId",
      value,
    });
    toast.success("Client ID do Gerencianet atualizado com sucesso.");
    setLoadingGerencianetClientId(false);
  }

  async function handleChangeGerencianetClientSecret(value) {
    setGerencianetClientSecret(value);
    setLoadingGerencianetClientSecret(true);
    await update({
      key: "gerencianetClientSecret",
      value,
    });
    toast.success("Client Secret do Gerencianet atualizado com sucesso.");
    setLoadingGerencianetClientSecret(false);
  }

  async function handleChangeGerencianetPixKey(value) {
    setGerencianetPixKey(value);
    setLoadingGerencianetPixKey(true);
    await update({
      key: "gerencianetPixKey",
      value,
    });
    toast.success("Chave PIX do Gerencianet atualizada com sucesso.");
    setLoadingGerencianetPixKey(false);
  }

  async function handleValidateWebhook() {
    if (!gerencianetWebhookUrl || !gerencianetWebhookUrl.trim()) {
      toast.error("Por favor, informe a URL do webhook.");
      return;
    }

    setValidatingWebhook(true);
    setWebhookValidationResult(null);

    try {
      const response = await api.post("/subscription/validate/webhook", {
        url: gerencianetWebhookUrl.trim()
      });

      if (response.data.success) {
        setWebhookValidationResult({
          success: true,
          message: response.data.message
        });
        toast.success("✅ " + response.data.message);
      } else {
        setWebhookValidationResult({
          success: false,
          message: response.data.message
        });
        toast.error("❌ " + response.data.message);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Erro ao validar webhook";
      setWebhookValidationResult({
        success: false,
        message: errorMessage
      });
      toast.error("❌ " + errorMessage);
    } finally {
      setValidatingWebhook(false);
    }
  }

  async function handleUploadGerencianetCert(event) {
    const input = event.target;
    const file = input?.files && input.files[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".p12")) {
      toast.error("Envie um certificado no formato .p12.");
      input.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingGerencianetCert(true);
    try {
      const { data } = await api.post("/settings/gerencianet-cert-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const certValue =
        data?.setting?.value ||
        data?.value ||
        data?.key ||
        (data?.filename ? data.filename.replace(/\.p12$/i, "") : "");

      if (certValue) {
        setGerencianetPixCert(certValue);
        toast.success("Certificado do Gerencianet enviado com sucesso.");
      } else {
        toast.warn("Certificado enviado, mas não foi possível atualizar a configuração automaticamente.");
      }
    } catch (error) {
      toast.error("Não foi possível enviar o certificado do Gerencianet.");
    } finally {
      setUploadingGerencianetCert(false);
      if (input) {
        input.value = "";
      }
    }
  }

  async function handleChangeTokenIxc(value) {
    setTokenIxcType(value);
    setLoadingTokenIxcType(true);
    await update({
      key: "tokenixc",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingTokenIxcType(false);
  }


  async function handleChangeIpMkauth(value) {
    setIpMkauthType(value);
    setLoadingIpMkauthType(true);
    await update({
      key: "ipmkauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingIpMkauthType(false);
  }

  async function handleChangeClientIdMkauth(value) {
    setClientIdMkauthType(value);
    setLoadingClientIdMkauthType(true);
    await update({
      key: "clientidmkauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingClientIdMkauthType(false);
  }

  async function handleChangeClientSecrectMkauth(value) {
    setClientSecrectMkauthType(value);
    setLoadingClientSecrectMkauthType(true);
    await update({
      key: "clientsecretmkauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingClientSecrectMkauthType(false);
  }

  async function handleChangeAsaas(value) {
    setAsaasType(value);
    setLoadingAsaasType(true);
    await update({
      key: "asaas",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingAsaasType(false);
  }

  async function handleChangeGeminiApiToken(value) {
    setGeminiApiToken(value);
    setLoadingGeminiApiToken(true);
    await update({
      key: "geminiApiToken",
      value,
    });
    toast.success("Token do Gemini atualizado com sucesso.");
    setLoadingGeminiApiToken(false);
  }

  async function handleChangeMercadoPagoPublicKey(value) {
    setMercadoPagoPublicKey(value);
    setLoadingMercadoPagoPublicKey(true);
    await update({
      key: "mercadoPagoPublicKey",
      value,
    });
    toast.success("Chave pública do Mercado Pago atualizada com sucesso.");
    setLoadingMercadoPagoPublicKey(false);
  }

  async function handleChangeMercadoPagoAccessToken(value) {
    setMercadoPagoAccessToken(value);
    setLoadingMercadoPagoAccessToken(true);
    await update({
      key: "mercadoPagoAccessToken",
      value,
    });
    toast.success("Token de acesso do Mercado Pago atualizado com sucesso.");
    setLoadingMercadoPagoAccessToken(false);
  }

  async function handleChangeMercadoPagoWebhookSecret(value) {
    setMercadoPagoWebhookSecret(value);
    setLoadingMercadoPagoWebhookSecret(true);
    await update({
      key: "mercadoPagoWebhookSecret",
      value,
    });
    toast.success("Chave secreta do webhook Mercado Pago atualizada com sucesso.");
    setLoadingMercadoPagoWebhookSecret(false);
  }

  async function handleChangeSubscriptionPaymentProvider(value) {
    setSubscriptionPaymentProvider(value);
    setLoadingSubscriptionPaymentProvider(true);
    await update({
      key: "subscriptionPaymentProvider",
      value,
    });
    toast.success("Provedor de cobrança atualizado com sucesso.");
    setLoadingSubscriptionPaymentProvider(false);
  }
  return (
    <>
      <Grid spacing={3} container>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="ratings-label">Avaliações</InputLabel>
            <Select
              labelId="ratings-label"
              value={userRating}
              onChange={async (e) => {
                handleChangeUserRating(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitadas</MenuItem>
              <MenuItem value={"enabled"}>Habilitadas</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserRating && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="schedule-type-label">
              Gerenciamento de Expediente
            </InputLabel>
            <Select
              labelId="schedule-type-label"
              value={scheduleType}
              onChange={async (e) => {
                handleScheduleType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"queue"}>Fila</MenuItem>
              <MenuItem value={"company"}>Empresa</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="group-type-label">
              Ignorar Mensagens de Grupos
            </InputLabel>
            <Select
              labelId="group-type-label"
              value={CheckMsgIsGroup}
              onChange={async (e) => {
                handleGroupType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desativado</MenuItem>
              <MenuItem value={"enabled"}>Ativado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="call-type-label">
              Aceitar Chamada
            </InputLabel>
            <Select
              labelId="call-type-label"
              value={callType}
              onChange={async (e) => {
                handleCallType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Não Aceitar</MenuItem>
              <MenuItem value={"enabled"}>Aceitar</MenuItem>
            </Select>
            <FormHelperText>
              {loadingCallType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
       <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="chatbot-type-label">
              Tipo Chatbot
            </InputLabel>
            <Select
              labelId="chatbot-type-label"
              value={chatbotType}
              onChange={async (e) => {
                handleChatbotType(e.target.value);
              }}
            >
              <MenuItem value={"text"}>Texto</MenuItem>
			 {/*<MenuItem value={"button"}>Botão</MenuItem>*/}
             {/*<MenuItem value={"list"}>Lista</MenuItem>*/}
            </Select>
            <FormHelperText>
              {loadingChatbotType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
		{/* ENVIAR SAUDAÇÃO AO ACEITAR O TICKET */}
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sendGreetingAccepted-label">Enviar saudação ao aceitar o ticket</InputLabel>
            <Select
              labelId="sendGreetingAccepted-label"
              value={SendGreetingAccepted}
              onChange={async (e) => {
                handleSendGreetingAccepted(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingSendGreetingAccepted && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        {SendGreetingAccepted === "enabled" && (
          <Grid xs={12} sm={12} md={12} item>
            <FormControl className={classes.selectContainer} fullWidth>
              <TextField
                id="sendGreetingAcceptedMessage"
                name="sendGreetingAcceptedMessage"
                margin="dense"
                label="Mensagem de saudação"
                variant="outlined"
                value={sendGreetingAcceptedMessage}
                onChange={(e) => setSendGreetingAcceptedMessage(e.target.value)}
                multiline
                minRows={4}
                placeholder="Ex.: {{ms}} {{name}}, meu nome é {{agent}} e vou prosseguir com seu atendimento!"
              />
              <FormHelperText>
                {`Variáveis disponíveis: {{ms}} (saudação), {{name}} (nome do contato), {{agent}} (atendente)`}
              </FormHelperText>
              <MuiButton
                variant="contained"
                color="primary"
                style={{ marginTop: 8, alignSelf: "flex-start" }}
                onClick={handleSaveGreetingMessage}
                disabled={savingGreetingMessage}
              >
                {savingGreetingMessage ? "Salvando..." : "Salvar mensagem"}
              </MuiButton>
            </FormControl>
          </Grid>
        )}
		{/* ENVIAR SAUDAÇÃO AO ACEITAR O TICKET */}
		
		{/* ENVIAR MENSAGEM DE TRANSFERENCIA DE SETOR/ATENDENTE */}
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sendMsgTransfTicket-label">Enviar mensagem de transferencia de Fila/agente</InputLabel>
            <Select
              labelId="sendMsgTransfTicket-label"
              value={SettingsTransfTicket}
              onChange={async (e) => {
                handleSettingsTransfTicket(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingSettingsTransfTicket && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        {SettingsTransfTicket === "enabled" && (
          <Grid xs={12} sm={12} md={12} item>
            <FormControl className={classes.selectContainer} fullWidth>
              <TextField
                id="sendMsgTransfTicketMessage"
                name="sendMsgTransfTicketMessage"
                margin="dense"
                label="Mensagem de transferência"
                variant="outlined"
                value={sendMsgTransfTicketMessage}
                onChange={(e) => setSendMsgTransfTicketMessage(e.target.value)}
                multiline
                minRows={4}
                placeholder="Ex.: {{ms}} {{name}}, seu atendimento foi transferido. Departamento: {{queue}}. Atendente: {{agent}}."
              />
              <FormHelperText>
                {`Variáveis disponíveis: {{ms}} (saudação), {{name}} (nome do contato), {{agent}} (novo atendente), {{queue}} (fila atual), {{previousAgent}} (atendente anterior), {{previousQueue}} (fila anterior)`}
              </FormHelperText>
              <MuiButton
                variant="contained"
                color="primary"
                style={{ marginTop: 8, alignSelf: "flex-start" }}
                onClick={handleSaveTransferMessage}
                disabled={savingTransferMessage}
              >
                {savingTransferMessage ? "Salvando..." : "Salvar mensagem"}
              </MuiButton>
            </FormControl>
          </Grid>
        )}
		
		{/* AVISO DE ANIVERSARIANTES */}
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="birthdayReminderEnabled-label">Ativar/Desativar aviso de aniversariantes</InputLabel>
            <Select
              labelId="birthdayReminderEnabled-label"
              value={birthdayReminderEnabled}
              onChange={async (e) => {
                handleBirthdayReminderEnabled(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingBirthdayReminderEnabled && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        {birthdayReminderEnabled === "enabled" && (
          <>
            <Grid xs={12} sm={12} md={6} item>
              <FormControl className={classes.selectContainer} fullWidth>
                <TextField
                  id="birthdayReminderTime"
                  name="birthdayReminderTime"
                  margin="dense"
                  label="Horário de disparo"
                  type="time"
                  variant="outlined"
                  value={birthdayReminderTime}
                  onChange={(e) => setBirthdayReminderTime(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Horário em que as mensagens de aniversário serão enviadas (formato: HH:MM)"
                />
                <MuiButton
                  variant="contained"
                  color="primary"
                  style={{ marginTop: 8, alignSelf: "flex-start" }}
                  onClick={handleSaveBirthdayReminderTime}
                  disabled={savingBirthdayReminderTime}
                >
                  {savingBirthdayReminderTime ? "Salvando..." : "Salvar horário"}
                </MuiButton>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={12} md={12} item>
              <FormControl className={classes.selectContainer} fullWidth>
                <TextField
                  id="birthdayMessage"
                  name="birthdayMessage"
                  margin="dense"
                  label="Mensagem de aniversário"
                  variant="outlined"
                  value={birthdayMessage}
                  onChange={(e) => setBirthdayMessage(e.target.value)}
                  multiline
                  minRows={4}
                  placeholder="Ex.: Parabéns {{name}}! 🎉🎂 Desejamos um feliz aniversário! Que você tenha {{idade}} anos de muita felicidade!"
                />
                <FormHelperText>
                  {`Variáveis disponíveis: {{name}} (nome do contato), {{idade}} (idade do contato)`}
                </FormHelperText>
                <MuiButton
                  variant="contained"
                  color="primary"
                  style={{ marginTop: 8, alignSelf: "flex-start" }}
                  onClick={handleSaveBirthdayMessage}
                  disabled={savingBirthdayMessage}
                >
                  {savingBirthdayMessage ? "Salvando..." : "Salvar mensagem"}
                </MuiButton>
              </FormControl>
            </Grid>
          </>
        )}
		
		{/* RECESSO/FERIADOS */}
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="holidayPeriodEnabled-label">Ativar/Desativar mensagem de recesso/feriados</InputLabel>
            <Select
              labelId="holidayPeriodEnabled-label"
              value={holidayPeriodEnabled}
              onChange={async (e) => {
                handleHolidayPeriodEnabled(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingHolidayPeriodEnabled && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        {holidayPeriodEnabled === "enabled" && (
          <>
            <Grid xs={12} sm={12} md={12} item>
              <FormControl className={classes.selectContainer}>
                <InputLabel id="holidayPeriodAllowQueueFlow-label">Mesmo com recesso fila funciona</InputLabel>
                <Select
                  labelId="holidayPeriodAllowQueueFlow-label"
                  value={holidayPeriodAllowQueueFlow}
                  onChange={async (e) => {
                    handleHolidayPeriodAllowQueueFlow(e.target.value);
                  }}
                >
                  <MenuItem value={"disabled"}>Desabilitado</MenuItem>
                  <MenuItem value={"enabled"}>Habilitado</MenuItem>
                </Select>
                <FormHelperText>
                  {loadingHolidayPeriodAllowQueueFlow && "Atualizando..."}
                  {!loadingHolidayPeriodAllowQueueFlow && "Quando habilitado, o fluxo de filas continua funcionando durante o recesso, mas sem atendimento"}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={12} md={12} item>
              <FormControl className={classes.selectContainer} fullWidth>
                <Typography variant="body2" color="textSecondary" style={{ marginTop: 8, marginBottom: 8 }}>
                  Configure os períodos de recesso/feriados nas configurações da conexão WhatsApp
                </Typography>
              </FormControl>
            </Grid>
          </>
        )}
		{/* ENVIAR SAUDAÇÃO QUANDO HOUVER SOMENTE 1 FILA */}
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sendGreetingMessageOneQueues-label">Enviar saudação quando houver somente 1 fila</InputLabel>
            <Select
              labelId="sendGreetingMessageOneQueues-label"
              value={sendGreetingMessageOneQueues}
              onChange={async (e) => {
                handleSendGreetingMessageOneQueues(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>Desabilitado</MenuItem>
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingSendGreetingMessageOneQueues && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id='viewclosed-label'>
              Operador Visualiza Tickets Fechados?
            </InputLabel>
            <Select
              labelId='viewclosed-label'
              value={viewclosed}
              onChange={async (e) => {
                handleviewclosed(e.target.value);
              }}
            >
              <MenuItem value={'disabled'}>Não</MenuItem>
              <MenuItem value={'enabled'}>Sim</MenuItem>
            </Select>
            <FormHelperText>
              {loadingviewclosed && 'Atualizando...'}
            </FormHelperText>
          </FormControl>
        </Grid>

        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id='viewgroups-label'>
              Operador Visualiza Grupos?
            </InputLabel>
            <Select
              labelId='viewgroups-label'
              value={viewgroups}
              onChange={async (e) => {
                handleviewgroups(e.target.value);
              }}
            >
              <MenuItem value={'disabled'}>Não</MenuItem>
              <MenuItem value={'enabled'}>Sim</MenuItem>
            </Select>
            <FormHelperText>
              {loadingviewgroups && 'Atualizando...'}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
		
		<OnlyForSuperUser
				user={currentUser}
				yes={() => (
				  <>
					<Grid spacing={3} container>
					  <Tabs
						indicatorColor='primary'
						textColor='primary'
						scrollButtons='on'
						variant='scrollable'
						className={classes.tab}
						style={{
						  marginBottom: 20,
						  marginTop: 20,
						}}
					  >
						<Tab label='Configurações Globais' />
					  </Tabs>
					</Grid>


            <Grid xs={12} sm={12} md={12} item>
                <FormControl className={classes.selectContainer}>
                  <InputLabel id='allowregister-label'>
                    Registro (Inscrição) Permitida?
                  </InputLabel>
                  <Select
                    labelId='allowregister-label'
                    value={allowregister}
                    onChange={async (e) => {
                      handleallowregister(e.target.value);
                    }}
                  >
                    <MenuItem value={'disabled'}>Não</MenuItem>
                    <MenuItem value={'enabled'}>Sim</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingallowregister && 'Atualizando...'}
                  </FormHelperText>
                </FormControl>
              </Grid>

				  <Grid xs={12} sm={12} md={12} item>
                <FormControl className={classes.selectContainer}>
                  <InputLabel id='viewregister-label'>
                    Registro (Inscrição) Visível?
                  </InputLabel>
                  <Select
                    labelId='viewregister-label'
                    value={viewregister}
                    onChange={async (e) => {
                      handleviewregister(e.target.value);
                    }}
                  >
                    <MenuItem value={'disabled'}>Não</MenuItem>
                    <MenuItem value={'enabled'}>Sim</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingviewregister && 'Atualizando...'}
                  </FormHelperText>
                </FormControl>
              </Grid>
			  
			                <Grid xs={12} sm={12} md={12} item>
                <FormControl className={classes.selectContainer}>
                  <InputLabel id='trial-label'>Tempo de Trial?</InputLabel>
                  <Select
                    labelId='trial-label'
                    value={trial}
                    onChange={async (e) => {
                      handletrial(e.target.value);
                    }}
                  >
                    <MenuItem value={'1'}>1</MenuItem>
                    <MenuItem value={'2'}>2</MenuItem>
                    <MenuItem value={'3'}>3</MenuItem>
                    <MenuItem value={'4'}>4</MenuItem>
                    <MenuItem value={'5'}>5</MenuItem>
                    <MenuItem value={'6'}>6</MenuItem>
                    <MenuItem value={'7'}>7</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingtrial && 'Atualizando...'}
                  </FormHelperText>
                </FormControl>
              </Grid>

      </>
        )}
      />
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
          <Tab

            label="INTEGRAÇÕES" />

        </Tabs>

      </Grid>
      {/*-----------------IXC-----------------*/}
      {/* COMENTADO - Seção IXC desabilitada
      <Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab

            label="IXC" />

        </Tabs>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ipixc"
              name="ipixc"
              margin="dense"
              label="IP do IXC"
              variant="outlined"
              value={ipixcType}
              onChange={async (e) => {
                handleChangeIPIxc(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingIpIxcType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="tokenixc"
              name="tokenixc"
              margin="dense"
              label="Token do IXC"
              variant="outlined"
              value={tokenixcType}
              onChange={async (e) => {
                handleChangeTokenIxc(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingTokenIxcType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      */}
      {/*-----------------MK-AUTH-----------------*/}
      {/* COMENTADO - Seção MK-AUTH desabilitada
      <Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab label="MK-AUTH" />

        </Tabs>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ipmkauth"
              name="ipmkauth"
              margin="dense"
              label="Ip Mk-Auth"
              variant="outlined"
              value={ipmkauthType}
              onChange={async (e) => {
                handleChangeIpMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingIpMkauthType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="clientidmkauth"
              name="clientidmkauth"
              margin="dense"
              label="Client Id"
              variant="outlined"
              value={clientidmkauthType}
              onChange={async (e) => {
                handleChangeClientIdMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingClientIdMkauthType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="clientsecretmkauth"
              name="clientsecretmkauth"
              margin="dense"
              label="Client Secret"
              variant="outlined"
              value={clientsecretmkauthType}
              onChange={async (e) => {
                handleChangeClientSecrectMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingClientSecrectMkauthType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      */}
      {/*-----------------ASAAS-----------------*/}
      <Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab label="ASAAS" />

        </Tabs>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="asaas"
              name="asaas"
              margin="dense"
              label="Token Asaas"
              variant="outlined"
              value={asaasType}
              onChange={async (e) => {
                handleChangeAsaas(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingAsaasType && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      {/*-----------------MERCADO PAGO-----------------*/}
      {isSuper() && (
        <Grid spacing={3} container style={{ marginBottom: 10 }}>
          <Tabs
            indicatorColor="primary"
            textColor="primary"
            scrollButtons="on"
            variant="scrollable"
            className={classes.tab}
          >
            <Tab label="MERCADO PAGO" />
          </Tabs>
          <Grid xs={12} sm={12} md={12} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="payment-provider-label">Provedor de cobrança</InputLabel>
              <Select
                labelId="payment-provider-label"
                value={subscriptionPaymentProvider}
                onChange={async (e) => {
                  handleChangeSubscriptionPaymentProvider(e.target.value);
                }}
              >
                <MenuItem value={"gerencianet"}>Gerencianet (Atual)</MenuItem>
                <MenuItem value={"mercadopago"}>Mercado Pago</MenuItem>
              </Select>
              <FormHelperText>
                {loadingSubscriptionPaymentProvider && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>
          {subscriptionPaymentProvider === "gerencianet" && (
            <>
              <Grid xs={12} sm={12} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <InputLabel id="gerencianet-sandbox-label">Ambiente</InputLabel>
                  <Select
                    labelId="gerencianet-sandbox-label"
                    value={gerencianetSandbox}
                    onChange={async (e) => {
                      handleChangeGerencianetSandbox(e.target.value);
                    }}
                  >
                    <MenuItem value={"false"}>Produção</MenuItem>
                    <MenuItem value={"true"}>Sandbox</MenuItem>
                  </Select>
                  <FormHelperText>
                    {loadingGerencianetSandbox && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="gerencianetClientId"
                    name="gerencianetClientId"
                    margin="dense"
                    label="Client ID"
                    variant="outlined"
                    value={gerencianetClientId}
                    onChange={async (e) => {
                      handleChangeGerencianetClientId(e.target.value);
                    }}
                    helperText="Client ID da aplicação Gerencianet"
                    fullWidth
                  />
                  <FormHelperText>
                    {loadingGerencianetClientId && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="gerencianetClientSecret"
                    name="gerencianetClientSecret"
                    margin="dense"
                    label="Client Secret"
                    variant="outlined"
                    value={gerencianetClientSecret}
                    onChange={async (e) => {
                      handleChangeGerencianetClientSecret(e.target.value);
                    }}
                    helperText="Client Secret da aplicação Gerencianet"
                    fullWidth
                  />
                  <FormHelperText>
                    {loadingGerencianetClientSecret && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="gerencianetPixKey"
                    name="gerencianetPixKey"
                    margin="dense"
                    label="Chave PIX"
                    variant="outlined"
                    value={gerencianetPixKey}
                    onChange={async (e) => {
                      handleChangeGerencianetPixKey(e.target.value);
                    }}
                    helperText="Chave PIX utilizada nas cobranças Gerencianet"
                    fullWidth
                  />
                  <FormHelperText>
                    {loadingGerencianetPixKey && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <MuiButton
                    variant="contained"
                    color="primary"
                    component="label"
                    style={{ marginTop: 8, alignSelf: "flex-start" }}
                    disabled={uploadingGerencianetCert}
                  >
                    {uploadingGerencianetCert ? "Enviando certificado..." : "Carregar certificado (.p12)"}
                    <input
                      type="file"
                      accept=".p12"
                      hidden
                      onChange={handleUploadGerencianetCert}
                    />
                  </MuiButton>
                  <FormHelperText>
                    {uploadingGerencianetCert
                      ? "Enviando certificado..."
                      : gerencianetPixCert
                        ? `Certificado atual: ${gerencianetPixCert}.p12`
                        : "Nenhum certificado enviado"}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={8} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="gerencianetWebhookUrl"
                    name="gerencianetWebhookUrl"
                    margin="dense"
                    label="URL do Webhook"
                    variant="outlined"
                    value={gerencianetWebhookUrl}
                    onChange={(e) => {
                      setGerencianetWebhookUrl(e.target.value);
                      setWebhookValidationResult(null);
                    }}
                    placeholder="https://api.seuapp.com/subscription/webhook"
                    helperText="URL do webhook para validação. Exemplo: https://api.seuapp.com/subscription/webhook"
                    fullWidth
                  />
                  {webhookValidationResult && (
                    <FormHelperText style={{
                      color: webhookValidationResult.success ? '#4caf50' : '#f44336',
                      marginTop: 8
                    }}>
                      {webhookValidationResult.success ? '✅ ' : '❌ '}
                      {webhookValidationResult.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={4} item>
                <FormControl className={classes.selectContainer}>
                  <MuiButton
                    variant="contained"
                    color="secondary"
                    style={{ marginTop: 8, alignSelf: "flex-start", minWidth: 150 }}
                    disabled={validatingWebhook || !gerencianetWebhookUrl || !gerencianetWebhookUrl.trim()}
                    onClick={handleValidateWebhook}
                  >
                    {validatingWebhook ? "Validando..." : "Validar Webhook"}
                  </MuiButton>
                  <FormHelperText>
                    {validatingWebhook && "Testando acessibilidade da URL..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </>
          )}
          {subscriptionPaymentProvider === "mercadopago" && (
            <>
              <Grid xs={12} sm={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="mercadoPagoPublicKey"
                    name="mercadoPagoPublicKey"
                    margin="dense"
                    label="Public Key"
                    variant="outlined"
                    value={mercadoPagoPublicKey}
                    onChange={async (e) => {
                      handleChangeMercadoPagoPublicKey(e.target.value);
                    }}
                    helperText="Informe a chave pública do Mercado Pago"
                    fullWidth
                  />
                  <FormHelperText>
                    {loadingMercadoPagoPublicKey && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="mercadoPagoAccessToken"
                    name="mercadoPagoAccessToken"
                    margin="dense"
                    label="Access Token"
                    variant="outlined"
                    value={mercadoPagoAccessToken}
                    onChange={async (e) => {
                      handleChangeMercadoPagoAccessToken(e.target.value);
                    }}
                    helperText="Informe o access token do Mercado Pago"
                    fullWidth
                  />
                  <FormHelperText>
                    {loadingMercadoPagoAccessToken && "Atualizando..."}
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={12} md={6} item>
                <FormControl className={classes.selectContainer}>
                  <TextField
                    id="mercadoPagoWebhookSecret"
                    name="mercadoPagoWebhookSecret"
                    margin="dense"
                    label="Chave Secreta do Webhook"
                    variant="outlined"
                    type="password"
                    value={mercadoPagoWebhookSecret}
                    onChange={async (e) => {
                      handleChangeMercadoPagoWebhookSecret(e.target.value);
                    }}
                    helperText="Assinatura secreta do webhook (encontrada no painel do Mercado Pago em 'Configurar notificações Webhooks' → campo 'Assinatura secreta')"
                    fullWidth
                  />
                  <FormHelperText>
                    {loadingMercadoPagoWebhookSecret && "Atualizando..."}
                    {!loadingMercadoPagoWebhookSecret && !mercadoPagoWebhookSecret && (
                      <span style={{ color: '#ff9800', fontSize: '0.75rem' }}>
                        ⚠️ Opcional, mas recomendado para maior segurança. Copie do campo "Assinatura secreta" no painel do Mercado Pago.
                      </span>
                    )}
                  </FormHelperText>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      )}
      {/*-----------------GEMINI-----------------*/}
      <Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab label="GEMINI AI" />

        </Tabs>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="geminiApiToken"
              name="geminiApiToken"
              margin="dense"
              label="Token da API do Gemini"
              variant="outlined"
              value={geminiApiToken}
              onChange={async (e) => {
                handleChangeGeminiApiToken(e.target.value);
              }}
              helperText="Configure o token da API do Google Gemini para habilitar sugestões automáticas de mensagens"
              fullWidth
            >
            </TextField>
            <FormHelperText>
              {loadingGeminiApiToken && "Atualizando..."}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <MuiButton
              variant="outlined"
              color="primary"
              onClick={() => setShowGeminiModelSelector(true)}
              fullWidth
              style={{ marginTop: 8 }}
            >
              Selecionar Modelo do Gemini
            </MuiButton>
            <FormHelperText>
              Modelo atual: {geminiModel === "gemini-2.0-flash-exp" ? "Gemini 2.0 Flash" : geminiModel}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      <GeminiModelSelector
        open={showGeminiModelSelector}
        onClose={(updated) => {
          setShowGeminiModelSelector(false);
          if (updated) {
            // Recarregar configurações
            window.location.reload();
          }
        }}
        currentModel={geminiModel}
        companyId={currentUser?.companyId}
      />
    </>
  );
}
