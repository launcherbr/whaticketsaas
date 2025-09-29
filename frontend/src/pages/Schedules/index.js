import React, { useState, useEffect, useReducer, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import moment from "moment";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import Tooltip from "@material-ui/core/Tooltip";
import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    borderRadius: 10,
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.divider,
  },
  searchField: {
    marginRight: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: 4,
    "& .MuiOutlinedInput-root": {
      borderRadius: 4,
      "& fieldset": {
        borderColor: theme.palette.divider,
      },
      "&:hover fieldset": {
        borderColor: theme.palette.primary.main,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
      },
    },
    "& .MuiInputBase-input": {
      color: theme.palette.text.primary,
    },
  },
  addButton: {
    borderRadius: 4,
    textTransform: "none",
    fontWeight: 500,
    boxShadow: "none",
    "&:hover": {
      boxShadow: "none",
    },
  },
  calendarContainer: {
    height: "calc(100vh - 180px)",
    marginTop: theme.spacing(2),
    "& .rbc-toolbar": {
      marginBottom: theme.spacing(2),
      color: theme.palette.text.primary,
      "& button": {
        color: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
        "&.rbc-active": {
          backgroundColor: theme.palette.action.selected,
          boxShadow: "none",
        },
      },
    },
    "& .rbc-header": {
      color: theme.palette.text.primary,
      borderBottomColor: theme.palette.divider,
    },
    "& .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row": {
      borderLeftColor: theme.palette.divider,
    },
    "& .rbc-off-range-bg": {
      backgroundColor: theme.palette.action.disabledBackground,
    },
    "& .rbc-event": {
      padding: "2px 5px",
      borderRadius: 4,
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      border: "none",
      "&:hover": {
        opacity: 0.9,
      },
    },
    "& .rbc-event-content": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    "& .rbc-today": {
      backgroundColor: theme.palette.action.selected,
    },
    "& .rbc-current-time-indicator": {
      backgroundColor: theme.palette.primary.main,
    },
    "& .rbc-time-view": {
      borderColor: theme.palette.divider,
      "& .rbc-time-header": {
        borderColor: theme.palette.divider,
      },
      "& .rbc-time-content": {
        borderTopColor: theme.palette.divider,
        "& .rbc-time-gutter": {
          color: theme.palette.text.secondary,
        },
      },
    },
    "& .rbc-agenda-view": {
      "& table.rbc-agenda-table": {
        borderColor: theme.palette.divider,
        "& thead > tr > th": {
          borderBottomColor: theme.palette.divider,
        },
        "& tbody > tr > td": {
          borderBottomColor: theme.palette.divider,
        },
      },
    },
    "& .rbc-month-view": {
      borderColor: theme.palette.divider,
    },
    "& .rbc-time-header": {
      borderColor: theme.palette.divider,
    },
  },
  eventActions: {
    display: "flex",
    gap: theme.spacing(1),
    "& svg": {
      fontSize: 16,
      cursor: "pointer",
      opacity: 0.8,
      transition: "opacity 0.2s",
      color: theme.palette.primary.contrastText,
      "&:hover": {
        opacity: 1,
      },
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 100,
  },
}));

const defaultMessages = {
  date: "Data",
  time: "Hora",
  event: "Evento",
  allDay: "Dia Todo",
  week: "Semana",
  work_week: "Agendamentos",
  day: "Dia",
  month: "Mês",
  previous: "Anterior",
  next: "Próximo",
  yesterday: "Ontem",
  tomorrow: "Amanhã",
  today: "Hoje",
  agenda: "Agenda",
  noEventsInRange: "Não há agendamentos no período.",
  showMore: (total) => `+${total} mais`,
};

const localizer = momentLocalizer(moment);

const schedulesReducer = (state, action) => {
  switch (action.type) {
    case "LOAD_SCHEDULES":
      const existingIds = new Set(state.map(s => s.id));
      const newSchedules = action.payload.filter(
        newSchedule => !existingIds.has(newSchedule.id)
      );
      return [...state, ...newSchedules];
      
    case "UPDATE_SCHEDULES":
      const schedule = action.payload;
      const existingSchedule = state.find(s => s.id === schedule.id);
      
      if (existingSchedule) {
        return state.map(item => 
          item.id === schedule.id ? schedule : item
        );
      }
      return [schedule, ...state];
      
    case "DELETE_SCHEDULE":
      return state.filter(s => s.id !== action.payload);
      
    case "RESET":
      return [];
      
    default:
      return state;
  }
};

const Schedules = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);

  const [state, setState] = useState({
    loading: false,
    pageNumber: 1,
    hasMore: false,
    searchParam: "",
    contactId: null,
    selectedSchedule: null,
    deletingSchedule: null,
    confirmModalOpen: false,
    scheduleModalOpen: false,
  });

  const [schedules, dispatch] = useReducer(schedulesReducer, []);

  const fetchSchedules = useCallback(async () => {
    try {
      setState(prev => ({...prev, loading: true}));
      
      const { data } = await api.get("/schedules/", {
        params: { searchParam: state.searchParam, pageNumber: state.pageNumber },
      });

      dispatch({ type: "LOAD_SCHEDULES", payload: data.schedules });
      setState(prev => ({
        ...prev,
        hasMore: data.hasMore,
        loading: false,
      }));
    } catch (err) {
      toastError(err);
      setState(prev => ({...prev, loading: false}));
    }
  }, [state.searchParam, state.pageNumber]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSchedules();
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [fetchSchedules]);

  useEffect(() => {
    const socket = socketManager.getSocket(user.companyId);

    const handleScheduleEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_SCHEDULES", payload: data.schedule });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_SCHEDULE", payload: data.scheduleId });
      }
    };

    socket.on(`company${user.companyId}-schedule`, handleScheduleEvent);

    return () => {
      socket.off(`company${user.companyId}-schedule`, handleScheduleEvent);
    };
  }, [socketManager, user.companyId]);

  const updateState = (updates) => {
    setState(prev => ({...prev, ...updates}));
  };

  const handleSearch = (event) => {
    updateState({
      searchParam: event.target.value.toLowerCase(),
      pageNumber: 1,
    });
    dispatch({ type: "RESET" });
  };

  const handleOpenScheduleModal = () => {
    updateState({
      selectedSchedule: null,
      scheduleModalOpen: true,
    });
  };

  const handleCloseScheduleModal = () => {
    updateState({
      selectedSchedule: null,
      scheduleModalOpen: false,
      contactId: null,
    });
  };

  const handleEditSchedule = (schedule) => {
    updateState({
      selectedSchedule: schedule,
      scheduleModalOpen: true,
    });
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success(i18n.t("schedules.toasts.deleted"));
      
      updateState({
        confirmModalOpen: false,
        deletingSchedule: null,
        searchParam: "",
        pageNumber: 1,
      });
      
      dispatch({ type: "RESET" });
      await fetchSchedules();
    } catch (err) {
      toastError(err);
    }
  };

  const handleScroll = (e) => {
    if (!state.hasMore || state.loading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      updateState(prev => ({...prev, pageNumber: prev.pageNumber + 1}));
    }
  };

  const EventComponent = ({ event }) => (
    <div className={classes.eventContent}>
      <Tooltip title={event.resource.schedule.contact.name} placement="top">
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {event.resource.schedule.contact.name}
        </span>
      </Tooltip>
      <div className={classes.eventActions}>
        <Tooltip title="Editar" placement="top">
          <EditIcon onClick={() => handleEditSchedule(event.resource.schedule)} />
        </Tooltip>
        <Tooltip title="Excluir" placement="top">
          <DeleteOutlineIcon 
            onClick={() => updateState({
              confirmModalOpen: true,
              deletingSchedule: event.resource.schedule,
            })}
          />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <MainContainer>
      <ConfirmationModal
        title={state.deletingSchedule && `${i18n.t("schedules.confirmationModal.deleteTitle")}`}
        open={state.confirmModalOpen}
        onClose={() => updateState({ confirmModalOpen: false })}
        onConfirm={() => handleDeleteSchedule(state.deletingSchedule?.id)}
      >
        {i18n.t("schedules.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      
      <ScheduleModal
        open={state.scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        reload={fetchSchedules}
        aria-labelledby="form-dialog-title"
        scheduleId={state.selectedSchedule?.id}
        contactId={state.contactId}
      />
      
      <MainHeader>
        <Title>{i18n.t("schedules.title")} ({schedules.length})</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            className={classes.searchField}
            placeholder={i18n.t("contacts.searchPlaceholder")}
            variant="outlined"
            size="small"
            value={state.searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon 
                    color={theme.palette.mode === 'dark' ? 'disabled' : 'action'} 
                  />
                </InputAdornment>
              ),
            }}
          />
          <Button
            className={classes.addButton}
            variant="contained"
            color="primary"
            onClick={handleOpenScheduleModal}
          >
            {i18n.t("schedules.buttons.add")}
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      
      <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
        {state.loading && schedules.length === 0 ? (
          <Box className={classes.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : (
          <div className={classes.calendarContainer}>
            <Calendar
              messages={defaultMessages}
              formats={{
                agendaDateFormat: "DD/MM ddd",
                weekdayFormat: "dddd",
                timeGutterFormat: "HH:mm",
              }}
              localizer={localizer}
              events={schedules.map(schedule => ({
                title: <EventComponent event={{ resource: { schedule } }} />,
                start: new Date(schedule.sendAt),
                end: new Date(schedule.sendAt),
                allDay: false,
                resource: { schedule },
              }))}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={["month", "week", "day", "agenda"]}
              culture="pt-BR"
              style={{ height: "100%" }}
            />
          </div>
        )}
      </Paper>
    </MainContainer>
  );
};

export default Schedules;