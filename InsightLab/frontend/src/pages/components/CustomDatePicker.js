import * as React from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function CustomDatePicker() {
  const [value, setValue] = React.useState(dayjs('2023-04-17'));
  const [open, setOpen] = React.useState(false);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(newValue) => setValue(newValue)}
        slotProps={{
          textField: {
            sx: { display: 'none' },
          },
          nextIconButton: { size: 'small' },
          previousIconButton: { size: 'small' },
        }}
        views={['day', 'month', 'year']}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={<CalendarTodayRoundedIcon fontSize="small" />}
        sx={{ minWidth: 'fit-content' }}
        onClick={() => setOpen(true)}
      >
        {value ? value.format('MMM DD, YYYY') : 'Select Date'}
      </Button>
    </LocalizationProvider>
  );
}
