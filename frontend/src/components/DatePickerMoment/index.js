import React, { useState } from 'react';

import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import { Box } from '@material-ui/core';

export const DatePickerMoment = ({ label, getDate }) => {
  const [selectedDate, setDate] = useState(null);
  const [inputValue, setInputValue] = useState(null);

  const onDateChange = (date, value) => {
    getDate(moment(date).format('YYYY-MM-DD'));
    setDate(date);
    setInputValue(value);
  };

  const dateFormatter = (str) => {
    return str;
  };

  return (
    <Box>
      <div
        style={{
          display: 'flex',
          alignSelf: 'center',
          justifyContent: 'center',
          borderRadius: 5,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#c1c1c1',
          maxWidth: 170,
          marginBottom: 15,
          alignItems: 'center',
          paddingInline: 5,
        }}
      >
        <label htmlFor='datePicker-input'>{label}</label>
        <MuiPickersUtilsProvider libInstance={moment} utils={MomentUtils}>
          <KeyboardDatePicker
            id='datePicker-input'
            style={{ padding: 2 }}
            autoOk={true}
            showTodayButton={true}
            value={selectedDate}
            format='DD/MM/YYYY'
            inputValue={inputValue}
            onChange={onDateChange}
            // rifmFormatter={dateFormatter}
          />
        </MuiPickersUtilsProvider>
      </div>
    </Box>
  );
};
