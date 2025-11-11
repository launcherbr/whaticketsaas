import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import IconButton from "@material-ui/core/IconButton";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Typography from "@material-ui/core/Typography";
import VisibilityIcon from "@material-ui/icons/Visibility";
import Alert from "@material-ui/lab/Alert";
import Snackbar from "@material-ui/core/Snackbar";

import { i18n } from "../../translate/i18n";
import { head } from "lodash";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@material-ui/core";
import ConfirmationModal from "../ConfirmationModal";
import AnnouncementAutoPopup from "../AnnouncementAutoPopup";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1),
    },
  },

  btnWrapper: {
    position: "relative",
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
}));

const AnnouncementSchema = Yup.object().shape({
  title: Yup.string().required("Obrigatório"),
  text: Yup.string().required("Obrigatório"),
});

const AnnouncementModal = ({ open, onClose, announcementId, reload }) => {
  const classes = useStyles();

  const initialState = {
    title: "",
    text: "",
    priority: 3,
    status: true,
    showForSuperAdmin: true,
    sendToAllCompanies: false,
  };

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(initialState);
  const [attachment, setAttachment] = useState(null);
  const attachmentFile = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, companiesCount: 0 });

  useEffect(() => {
    try {
      (async () => {
        if (!announcementId) return;

        const { data } = await api.get(`/announcements/${announcementId}`);
        setAnnouncement((prevState) => {
          return { ...prevState, ...data };
        });
      })();
    } catch (err) {
      toastError(err);
    }
  }, [announcementId, open]);

  const handleClose = () => {
    setAnnouncement(initialState);
    setAttachment(null);
    if (previewData?.fromObjectUrl) {
      URL.revokeObjectURL(previewData.mediaPath);
    }
    setShowPreview(false);
    setPreviewData(null);
    setSuccessSnackbar({ open: false, companiesCount: 0 });
    onClose();
  };

  const handleAttachmentFile = (e) => {
    const file = head(e.target.files);
    if (file) {
      setAttachment(file);
    }
  };

  const handleSaveAnnouncement = async (values) => {
    const announcementData = { ...values };
    try {
      if (announcementId) {
        await api.put(`/announcements/${announcementId}`, announcementData);
        if (attachment != null) {
          const formData = new FormData();
		  formData.append("typeArch", "announcements");
          formData.append("file", attachment);
          await api.post(
            `/announcements/${announcementId}/media-upload`,
            formData
          );
        }
        toast.success(i18n.t("announcements.toasts.success"));
      } else {
        const response = await api.post("/announcements", announcementData);
        const announcementId = response.data.announcement?.id || response.data.id;
        
        if (attachment != null && announcementId) {
          const formData = new FormData();
		  formData.append("typeArch", "announcements");
          formData.append("file", attachment);
          await api.post(`/announcements/${announcementId}/media-upload`, formData);
        }
        
        // Mostrar barra de sucesso com quantidade de empresas
        const companiesCount = response.data.companiesCount || response.data.announcement?.companiesCount || 1;
        if (announcementData.sendToAllCompanies) {
          setSuccessSnackbar({ open: true, companiesCount });
          handleClose();
        } else {
          toast.success(i18n.t("announcements.toasts.success"));
        }
      }
      if (typeof reload == "function") {
        reload();
      }
    } catch (err) {
      toastError(err);
      handleClose();
    }
    if (!announcementData.sendToAllCompanies) {
      handleClose();
    }
  };

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      attachmentFile.current.value = null;
    }

    if (announcement.mediaPath) {
      await api.delete(`/announcements/${announcement.id}/media-upload`);
      setAnnouncement((prev) => ({
        ...prev,
        mediaPath: null,
      }));
      toast.success(i18n.t("announcements.toasts.deleted"));
      if (typeof reload == "function") {
        reload();
      }
    }
  };

  return (
    <div className={classes.root}>
      <ConfirmationModal
        title={i18n.t("announcements.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={deleteMedia}
      >
        {i18n.t("announcements.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {announcementId
            ? `${i18n.t("announcements.dialog.edit")}`
            : `${i18n.t("announcements.dialog.add")}`}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            ref={attachmentFile}
            onChange={(e) => handleAttachmentFile(e)}
          />
        </div>
        <Formik
          initialValues={{
            ...announcement,
            showForSuperAdmin: announcement.showForSuperAdmin !== undefined ? announcement.showForSuperAdmin : true,
            sendToAllCompanies: announcement.sendToAllCompanies !== undefined ? announcement.sendToAllCompanies : false
          }}
          enableReinitialize={true}
          validationSchema={AnnouncementSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveAnnouncement(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, values, setFieldValue }) => {
            const handlePreview = () => {
              if (previewData?.fromObjectUrl) {
                URL.revokeObjectURL(previewData.mediaPath);
              }

              const objectUrl = attachment ? URL.createObjectURL(attachment) : null;

              const preview = {
                title: values.title || "",
                text: values.text || "",
                priority: values.priority || 3,
                mediaPath: objectUrl || announcement.mediaPath,
                mediaName: attachment ? attachment.name : announcement.mediaName,
                fromObjectUrl: Boolean(objectUrl)
              };

              setPreviewData(preview);
              setShowPreview(true);
            };

            return (
            <Form>
              <DialogContent dividers>
                <Grid spacing={2} container>
                  <Grid xs={12} item>
                    <Field
                      as={TextField}
                      label={i18n.t("announcements.dialog.form.title")}
                      name="title"
                      error={touched.title && Boolean(errors.title)}
                      helperText={touched.title && errors.title}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  </Grid>
                  <Grid xs={12} item>
                    <Field
                      as={TextField}
                      label={i18n.t("announcements.dialog.form.text")}
                      name="text"
                      error={touched.text && Boolean(errors.text)}
                      helperText={touched.text && errors.text}
                      variant="outlined"
                      margin="dense"
                      multiline={true}
                      rows={7}
                      fullWidth
                    />
                  </Grid>
                  <Grid xs={12} item>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel id="status-selection-label">
                        {i18n.t("announcements.dialog.form.status")}
                      </InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("announcements.dialog.form.status")}
                        placeholder={i18n.t("announcements.dialog.form.status")}
                        labelId="status-selection-label"
                        id="status"
                        name="status"
                        error={touched.status && Boolean(errors.status)}
                      >
                        <MenuItem value={true}>Ativo</MenuItem>
                        <MenuItem value={false}>Inativo</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} item>
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel id="priority-selection-label">
                        {i18n.t("announcements.dialog.form.priority")}
                      </InputLabel>
                      <Field
                        as={Select}
                        label={i18n.t("announcements.dialog.form.priority")}
                        placeholder={i18n.t(
                          "announcements.dialog.form.priority"
                        )}
                        labelId="priority-selection-label"
                        id="priority"
                        name="priority"
                        error={touched.priority && Boolean(errors.priority)}
                      >
                        <MenuItem value={1}>Alta</MenuItem>
                        <MenuItem value={2}>Média</MenuItem>
                        <MenuItem value={3}>Baixa</MenuItem>
                      </Field>
                    </FormControl>
                  </Grid>
                  <>
                    <Grid xs={12} item>
                      <Field name="sendToAllCompanies">
                        {({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                color="primary"
                                checked={Boolean(field.value)}
                                onChange={(event) => setFieldValue(field.name, event.target.checked)}
                              />
                            }
                            label="Enviar para todas as empresas"
                          />
                        )}
                      </Field>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Quando ativado, o anúncio será enviado para todas as empresas cadastradas
                      </Typography>
                    </Grid>
                    <Grid xs={12} item>
                      <Field name="showForSuperAdmin">
                        {({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                color="primary"
                                checked={Boolean(field.value)}
                                onChange={(event) => setFieldValue(field.name, event.target.checked)}
                              />
                            }
                            label="Mostrar para superadmin"
                          />
                        )}
                      </Field>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Quando desativado, o anúncio não será exibido para superadmins
                      </Typography>
                    </Grid>
                  </>
                  {(announcement.mediaPath || attachment) && (
                    <Grid xs={12} item>
                      <Button startIcon={<AttachFileIcon />}>
                        {attachment ? attachment.name : announcement.mediaName}
                      </Button>
                      <IconButton
                        onClick={() => setConfirmationOpen(true)}
                        color="secondary"
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button
                  color="primary"
                  onClick={handlePreview}
                  disabled={isSubmitting || !values.title || !values.text}
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                >
                  Visualizar
                </Button>
                {!attachment && !announcement.mediaPath && (
                  <Button
                    color="primary"
                    onClick={() => attachmentFile.current.click()}
                    disabled={isSubmitting}
                    variant="outlined"
                  >
                    {i18n.t("announcements.dialog.buttons.attach")}
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("announcements.dialog.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {announcementId
                    ? `${i18n.t("announcements.dialog.buttons.add")}`
                    : `${i18n.t("announcements.dialog.buttons.edit")}`}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
            );
          }}
        </Formik>
      </Dialog>
      <AnnouncementAutoPopup
        announcement={previewData}
        open={showPreview}
        onClose={() => {
          if (previewData?.fromObjectUrl) {
            URL.revokeObjectURL(previewData.mediaPath);
          }
          setShowPreview(false);
          setPreviewData(null);
        }}
      />
      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setSuccessSnackbar({ open: false, companiesCount: 0 })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessSnackbar({ open: false, companiesCount: 0 })}
          severity="success"
          variant="filled"
        >
          Anúncio enviado com sucesso para {successSnackbar.companiesCount} {successSnackbar.companiesCount === 1 ? "empresa" : "empresas"}!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AnnouncementModal;
