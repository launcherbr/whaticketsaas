import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	formControl: {
		width: '100%',
	},
}));

const MoveQueue = ({ selectedMoveQueueId, companyId, onChange }) => {
  const classes = useStyles();
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/queue", {
          params: { companyId },
        });
        setQueues(data);
      } catch (err) {
        toastError(err);
      }
    })();
  }, [companyId]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div style={{ marginTop: 6 }}>
      <FormControl className={classes.formControl} margin="dense" variant="outlined">
        <InputLabel>{i18n.t("queueSelect.moveQueue")}</InputLabel>
        <Select
          labelWidth={60}
          value={selectedMoveQueueId}
          onChange={handleChange}
          MenuProps={{
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "left",
            },
            transformOrigin: {
              vertical: "top",
              horizontal: "left",
            },
            getContentAnchorEl: null,
          }}
        >
          {queues.map((queue) => (
            <MenuItem key={queue.id} value={queue.id}>
              {queue.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default MoveQueue;