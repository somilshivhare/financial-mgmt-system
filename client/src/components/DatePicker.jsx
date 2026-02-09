import React, { useMemo } from 'react';
import "../styles/DatePicker.css";

/** Value to YYYY-MM-DD for type="date" */
function toDateValue(value) {
  if (value === '' || value == null) return '';
  const s = String(value).trim();
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Value to YYYY-MM for type="month" */
function toMonthValue(value) {
  if (value === '' || value == null) return '';
  const s = String(value).trim();
  if (!s) return '';
  const match = /^(\d{4})-(\d{2})/.exec(s);
  if (match) return `${match[1]}-${match[2]}`;
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Value to yyyy-MM-ddThh:mm for type="datetime-local" */
function toDateTimeLocalValue(value) {
  if (value === '' || value == null) return '';
  const s = String(value).trim();
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

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
  minDate,
  maxDate,
  ...props
}) => {
  const dateVal = useMemo(() => (showMonthYearPicker ? toMonthValue(selected) : toDateValue(selected)), [selected, showMonthYearPicker]);
  const dateTimeVal = useMemo(() => toDateTimeLocalValue(selected), [selected]);
  const minVal = useMemo(() => (minDate != null && minDate !== '' ? (showMonthYearPicker ? toMonthValue(minDate) : toDateValue(minDate)) : undefined), [minDate, showMonthYearPicker]);
  const maxVal = useMemo(() => (maxDate != null && maxDate !== '' ? (showMonthYearPicker ? toMonthValue(maxDate) : toDateValue(maxDate)) : undefined), [maxDate, showMonthYearPicker]);

  const handleDateChange = (e) => {
    const v = e.target.value;
    onChange({ target: { name, value: v } });
  };

  const handleMonthChange = (e) => {
    const v = e.target.value;
    onChange({ target: { name, value: v } });
  };

  const handleDateTimeChange = (e) => {
    const v = e.target.value;
    if (!v) {
      onChange({ target: { name, value: '' } });
      return;
    }
    onChange({ target: { name, value: new Date(v).toISOString() } });
  };

  if (showTimeSelect) {
    return (
      <div className={`date-picker-container ${className}`}>
        <input
          type="datetime-local"
          id={id}
          name={name}
          className="date-picker-input"
          value={dateTimeVal}
          onChange={handleDateTimeChange}
          disabled={disabled}
          required={required}
          min={minVal}
          max={maxVal}
          autoComplete="off"
          {...props}
        />
      </div>
    );
  }

  if (showMonthYearPicker) {
    return (
      <div className={`date-picker-container ${className}`}>
        <input
          type="month"
          id={id}
          name={name}
          className="date-picker-input"
          value={dateVal}
          onChange={handleMonthChange}
          disabled={disabled}
          required={required}
          min={minVal}
          max={maxVal}
          autoComplete="off"
          {...props}
        />
      </div>
    );
  }

  return (
    <div className={`date-picker-container ${className}`}>
      <input
        type="date"
        id={id}
        name={name}
        className="date-picker-input"
        value={dateVal}
        onChange={handleDateChange}
        disabled={disabled}
        required={required}
        min={minVal}
        max={maxVal}
        autoComplete="off"
        {...props}
      />
    </div>
  );
};

export default React.memo(DatePicker);
