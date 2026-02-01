import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/DatePicker.css";

const DatePicker = ({ 
  selected, 
  onChange, 
  placeholderText = "Select date",
  className = "",
  id,
  name,
  disabled = false,
  required = false,
  showTimeSelect = false,
  showMonthYearPicker = false,
  dateFormat = "yyyy-MM-dd",
  timeFormat = "HH:mm",
  ...props 
}) => {
  return (
    <div className={`date-picker-container ${className}`}>
      <ReactDatePicker
        selected={selected ? new Date(selected) : null}
        onChange={(date) => {
          if (date) {
            if (showTimeSelect) {
              // ISO string for datetime
              onChange({ target: { name, value: date.toISOString() } });
            } else if (showMonthYearPicker) {
              // Format back to YYYY-MM for consistency with month inputs
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              onChange({ target: { name, value: `${yyyy}-${mm}` } });
            } else {
              // Format back to YYYY-MM-DD for consistency
              const yyyy = date.getFullYear();
              const mm = String(date.getMonth() + 1).padStart(2, '0');
              const dd = String(date.getDate()).padStart(2, '0');
              onChange({ target: { name, value: `${yyyy}-${mm}-${dd}` } });
            }
          } else {
            onChange({ target: { name, value: '' } });
          }
        }}
        placeholderText={placeholderText}
        className="date-picker-input"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        dateFormat={showMonthYearPicker ? "yyyy-MM" : (showTimeSelect ? `${dateFormat} ${timeFormat}` : dateFormat)}
        showTimeSelect={showTimeSelect}
        showMonthYearPicker={showMonthYearPicker}
        timeFormat={timeFormat}
        autoComplete="off"
        {...props}
      />
      <Calendar className="date-picker-icon" size={16} />
    </div>
  );
};

export default DatePicker;
