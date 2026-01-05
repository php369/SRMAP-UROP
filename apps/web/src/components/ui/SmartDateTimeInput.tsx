import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SmartDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  disabled?: boolean;
  minDateTime?: string; // For end date to be after start date
}

export function SmartDateTimeInput({ value, onChange, label, className = '', disabled = false, minDateTime }: SmartDateTimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState({ hours: '12', minutes: '00', period: 'AM' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      // Convert to 12-hour format for display
      let hours = date.getHours();
      const isPM = hours >= 12;
      if (hours === 0) hours = 12;
      if (hours > 12) hours -= 12;
      
      setSelectedTime({
        hours: String(hours).padStart(2, '0'),
        minutes: String(date.getMinutes()).padStart(2, '0'),
        period: isPM ? 'PM' : 'AM'
      });
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format current time to datetime-local format
  const getCurrentDateTime = () => {
    // If minDateTime is provided (for end date), use one minute after that
    if (minDateTime) {
      const minDate = new Date(minDateTime);
      minDate.setMinutes(minDate.getMinutes() + 1);
      const year = minDate.getFullYear();
      const month = String(minDate.getMonth() + 1).padStart(2, '0');
      const day = String(minDate.getDate()).padStart(2, '0');
      const hours = String(minDate.getHours()).padStart(2, '0');
      const minutes = String(minDate.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // For start date or any field without minDateTime, use next minute from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Add 1 minute to current time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format display value
  const formatDisplayValue = (dateTimeValue: string) => {
    if (!dateTimeValue) return '';
    try {
      const date = new Date(dateTimeValue);
      return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        hour12: true
      });
    } catch {
      return dateTimeValue;
    }
  };

  // Handle field click
  const handleFieldClick = () => {
    if (disabled) return;
    
    // Set current time if empty
    if (!value) {
      const currentDateTime = getCurrentDateTime();
      onChange(currentDateTime);
      const date = new Date(currentDateTime);
      setSelectedDate(date);
      // Convert to 12-hour format
      let hours = date.getHours();
      const isPM = hours >= 12;
      if (hours === 0) hours = 12;
      if (hours > 12) hours -= 12;
      
      setSelectedTime({
        hours: String(hours).padStart(2, '0'),
        minutes: String(date.getMinutes()).padStart(2, '0'),
        period: isPM ? 'PM' : 'AM'
      });
    }
    
    setIsOpen(!isOpen);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    const minDate = minDateTime ? new Date(minDateTime) : today;
    const currentValue = value ? new Date(value) : null;

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = currentValue && date.toDateString() === currentValue.toDateString();
      const isPast = date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isPast
      });
    }

    return days;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const minDate = minDateTime ? new Date(minDateTime) : new Date();
    if (date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
      return; // Don't allow dates before minimum
    }
    
    setSelectedDate(date);
    updateDateTime(date, selectedTime);
  };

  // Handle time change
  const handleTimeChange = (field: 'hours' | 'minutes' | 'period', value: string) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    updateDateTime(selectedDate, newTime);
  };

  // Update the final datetime value
  const updateDateTime = (date: Date, time: { hours: string; minutes: string; period: string }) => {
    const newDate = new Date(date);
    let hours = parseInt(time.hours);
    
    // Convert 12-hour to 24-hour format
    if (time.period === 'AM' && hours === 12) {
      hours = 0;
    } else if (time.period === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    newDate.setHours(hours, parseInt(time.minutes), 0, 0);
    
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const hours24 = String(newDate.getHours()).padStart(2, '0');
    const minutes = String(newDate.getMinutes()).padStart(2, '0');
    
    onChange(`${year}-${month}-${day}T${hours24}:${minutes}`);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-2 text-sm font-medium">{label} *</label>
      
      {/* Display field */}
      <div className="relative">
        <input
          type="text"
          value={formatDisplayValue(value)}
          readOnly
          disabled={disabled}
          onClick={handleFieldClick}
          className={`w-full px-4 py-2 pr-10 border rounded-lg cursor-pointer bg-white ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
          } ${className}`}
          placeholder="Click to select date and time"
        />
        
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          onClick={handleFieldClick}
        >
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Custom Dropdown Picker */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-semibold">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(day.date)}
                disabled={day.isPast}
                className={`
                  p-2 text-sm rounded hover:bg-blue-100 transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                  ${day.isToday ? 'bg-blue-100 font-semibold' : ''}
                  ${day.isSelected ? 'bg-blue-500 text-white' : ''}
                  ${day.isPast ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' : ''}
                `}
              >
                {day.day}
              </button>
            ))}
          </div>

          {/* Time Picker */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedTime.hours}
                onChange={(e) => handleTimeChange('hours', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const hour = i === 0 ? 12 : i;
                  return (
                    <option key={i} value={String(hour).padStart(2, '0')}>
                      {String(hour).padStart(2, '0')}
                    </option>
                  );
                })}
              </select>
              <span className="text-sm">:</span>
              <select
                value={selectedTime.minutes}
                onChange={(e) => handleTimeChange('minutes', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={String(i).padStart(2, '0')}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <select
                value={selectedTime.period}
                onChange={(e) => handleTimeChange('period', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!value) {
                  const currentDateTime = getCurrentDateTime();
                  onChange(currentDateTime);
                }
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500">
        {value && (
          <span>
            Selected: {formatDisplayValue(value)}
            {new Date(value) < new Date() && (
              <span className="text-amber-600 ml-2">⚠️ Past date/time</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}