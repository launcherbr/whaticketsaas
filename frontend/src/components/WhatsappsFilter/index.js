import { Box, Chip, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useState } from "react";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

export function WhatsappsFilter({ onFiltered, initialWhatsapps }) {
  const [whatsapps, setWhatsapps] = useState([]);
  const [selecteds, setSelecteds] = useState([]);

  useEffect(() => {
    async function fetchData() {
      await loadWhatsapps();
    }
    fetchData();
  }, []);

  useEffect(() => {
    setSelecteds([]);
    if (
      Array.isArray(initialWhatsapps) &&
      Array.isArray(whatsapps) &&
      whatsapps.length > 0
    ) {
      onChange(initialWhatsapps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWhatsapps, whatsapps]);

  const loadWhatsapps = async () => {
    try {
      const { data } = await api.get(`/whatsapp`);
      const whatsappList = data.map((w) => ({ id: w.id, name: w.name, channel: w.channel }));
      setWhatsapps(whatsappList);
    } catch (err) {
      toastError(err);
    }
  };

  const onChange = async (value) => {
    setSelecteds(value);
    onFiltered(value);
  };

  return (
    <Box style={{ padding: "0px 10px 10px" }}>
      <Autocomplete
        multiple
        size="small"
        options={whatsapps}
        value={selecteds}
        onChange={(e, v, r) => onChange(v)}
        getOptionLabel={(option) => option.name}
        getOptionSelected={(option, value) => {
          return (
            option?.id === value?.id ||
            option?.name.toLowerCase() === value?.name.toLowerCase()
          );
        }}
        renderTags={(value, getWhatsappProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              style={{
                backgroundColor: "#bfbfbf",
                textShadow: "1px 1px 1px #000",
                color: "white",
              }}
              label={option.name}
              {...getWhatsappProps({ index })}
              size="small"
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={i18n.t("tickets.search.filterConnections")}
          />
        )}
      />
    </Box>
  );
}
