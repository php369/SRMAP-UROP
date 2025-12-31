import { Calendar } from 'lucide-react';
import { useRef } from 'react';

interface SmartDateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

export function SmartDateTimeInput({ value, onChange, label, className = '', disabled = false }: SmartDateTimeInputProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

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

  // Handle click on the entire field
  const handleFieldClick = () => {
    if (disabled) return;
    
    // Set current time if empty
    if (!value) {
      onChange(getCurrentDateTime());
    }
    
    // Focus the hidden input to open the picker
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
      hiddenInputRef.current.click();
    }
  };

  // Handle input focus - set current time as default if empty
  const handleFocus = () => {
    if (!value) {
      onChange(getCurrentDateTime());
    }
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
      
      {/* Display field with calendar icon */}
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
        
        {/* Calendar icon */}
        <div 
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          onClick={handleFieldClick}
        >
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Hidden datetime-local input - positioned off-screen but accessible */}
        <input
          ref={hiddenInputRef}
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          min={getMinDateTime()}
          disabled={disabled}
          className="absolute -left-[9999px] opacity-0 pointer-events-none"
          tabIndex={-1}
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