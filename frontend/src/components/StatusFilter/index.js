import { Box, Chip, TextField } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import React, { useEffect, useState } from "react";
import { i18n } from "../../translate/i18n";


export function StatusFilter({ onFiltered }) {
  const [selecteds, setSelecteds] = useState([]);

  useEffect(() => {
    async function fetchData() {
      
    }
    fetchData();
  }, []);

  const onChange = async (value) => {
    setSelecteds(value);
    onFiltered(value);
  };

  const status = [
    { status: 'open', name: `${i18n.t("tickets.search.filterConectionsOptions.open")}` },
    { status: 'closed', name: `${i18n.t("tickets.search.filterConectionsOptions.closed")}` },
    { status: 'pending', name: `${i18n.t("tickets.search.filterConectionsOptions.pending")}` },
    { status: 'group', name: 'Grupos' },

  ]

  return (
    <Box style={{ padding: "0px 10px 10px" }}>
      <Autocomplete 
       multiple      
       size="small"
       options={status}
       value={selecteds}
       onChange={(e, v, r) => onChange(v)}
       getOptionLabel={(option) => option.name}
       renderTags={(value, getTagProps) =>
         value.map((option, index) => (
           <Chip
             variant="outlined"
             style={{
               backgroundColor: option.color || "#eee",
               textShadow: "1px 1px 1px #000",
               color: "white",
             }}
             label={option.name}
             {...getTagProps({ index })}
             size="small"
           />
         ))
       }
       renderInput={(params) => (
         <TextField
           {...params}
           variant="outlined"
           placeholder="Filtro por Status"
         />
       )}
      />
    </Box>
  );
}
