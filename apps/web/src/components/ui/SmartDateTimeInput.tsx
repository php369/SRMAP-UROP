import { useState, useEffect } from 'react';

interface SmartDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

export function SmartDateTimeInput({ value, onChange, label, className = '', disabled = false }: SmartDateTimeInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Format current time to datetime-local format
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Get minimum datetime (current time)
  const getMinDateTime = () => {
    return getCurrentDateTime();
  };

  // Handle input focus - set current time as default if empty
  const handleFocus = () => {
    setIsOpen(true);
    if (!value) {
      onChange(getCurrentDateTime());
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsOpen(false);
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

  return (
    <div className="relative">
      <label className="block mb-2 text-sm font-medium">{label} *</label>
      
      {/* Display field */}
      <div className="relative">
        <input
          type="text"
          value={formatDisplayValue(value)}
          onFocus={handleFocus}
          readOnly
          disabled={disabled}
          className={`w-full px-4 py-2 border rounded-lg cursor-pointer bg-white ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-400'
          } ${className}`}
          placeholder="Click to select date and time"
        />
        
        {/* Hidden datetime-local input */}
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          min={getMinDateTime()}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: isOpen ? 10 : -1 }}
        />
      </div>
      
      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500">
        {!value && 'Will default to current time when clicked'}
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