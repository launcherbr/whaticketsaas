import * as React from 'react';

import {
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Box,
} from '@material-ui/core';

export default function UsersDropdown({ users, setUser, value }) {
  const handleChange = (event) => {
    setUser(event.target.value);
  };

  return (
    <Box sx={{ width: 230, marginTop: 8, marginBottom: 2 }}>
      <FormControl variant="outlined" fullWidth size="small">
        <InputLabel id="demo-simple-select-autowidth-label">
          Atendente
        </InputLabel>
        <Select
          labelId="demo-simple-select-autowidth-label"
          id="demo-simple-select-autowidth"
          variant="outlined"
          value={value ? value : ''}
          onChange={handleChange}
          label="Atendente"
        >
          <MenuItem value={null}>Nenhum Atendente</MenuItem>
          {users.map((user, index) => (
            <MenuItem key={index} value={user.id}>
              {user.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
