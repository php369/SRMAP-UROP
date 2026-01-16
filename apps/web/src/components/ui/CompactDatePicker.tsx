import { DatePicker } from "@heroui/date-picker";
import { parseZonedDateTime, ZonedDateTime, now, getLocalTimeZone } from "@internationalized/date";
import { cn } from "../../lib/utils";

interface CompactDatePickerProps {
    label: string;
    value?: string | null;
    onChange: (value: string) => void;
    className?: string;
    errorMessage?: string;
    isRequired?: boolean;
    minValue?: ZonedDateTime;
    color?: string;
}

/**
 * Format a date string to dd/mm/yyyy, hh:mm AM/PM format
 */
const formatDateDisplay = (dateStr: string): string => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12

        return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
    } catch {
        return '';
    }
};

/**
 * A styled DatePicker using HeroUI with:
 * - Custom dd/mm/yyyy display format
 * - Time fields at the bottom
 */
export function CompactDatePicker({
    label,
    value,
    onChange,
    className,
    errorMessage,
    isRequired,
    minValue,
    color
}: CompactDatePickerProps) {

    // Convert ISO string to ZonedDateTime for the picker
    const getPickerValue = (): ZonedDateTime | null => {
        try {
            if (value) {
                const dateStr = value.replace('Z', '').replace(/\+.*$/, '');
                return parseZonedDateTime(`${dateStr}[Asia/Kolkata]`);
            }
        } catch (e) {
            console.warn("CompactDatePicker: parse error", e);
        }
        return null;
    };

    // Convert ZonedDateTime back to ISO string format
    const handleChange = (val: ZonedDateTime | null) => {
        if (!val) return;

        const year = val.year;
        const month = String(val.month).padStart(2, '0');
        const day = String(val.day).padStart(2, '0');
        const hour = String(val.hour).padStart(2, '0');
        const minute = String(val.minute).padStart(2, '0');
        const second = String(val.second).padStart(2, '0');

        onChange(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    };

    // Default min value is NOW if not provided
    const effectiveMinValue = minValue || now(getLocalTimeZone());

    // Custom formatted display string (dd/mm/yyyy)
    const displayValue = value ? formatDateDisplay(value) : '';

    return (
        <div className="relative group">
            {/* Color Indicator Line */}
            {color && (
                <div
                    className="absolute left-0 top-8 bottom-0 w-1 rounded-l-xl z-20 pointer-events-none transition-opacity"
                    style={{ backgroundColor: color, opacity: value ? 1 : 0.3 }}
                />
            )}

            <DatePicker
                label={label}
                value={getPickerValue()}
                onChange={handleChange}
                minValue={effectiveMinValue}
                isRequired={isRequired}
                errorMessage={errorMessage}
                isInvalid={!!errorMessage}

                // Core Settings
                hideTimeZone
                hourCycle={12}
                granularity="minute"

                // Appearance
                variant="bordered"
                labelPlacement="outside"

                // Calendar styling 
                calendarProps={{
                    classNames: {
                        base: "bg-white shadow-xl rounded-xl border border-slate-200",
                        headerWrapper: "pt-4 bg-white",
                        header: "text-slate-700 font-semibold",
                        prevButton: "text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full",
                        nextButton: "text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full",
                        gridWrapper: "pb-4",
                        gridHeader: "bg-slate-50/50",
                        gridHeaderCell: "text-slate-500 text-xs font-semibold",
                        cellButton: [
                            "hover:bg-slate-100 rounded-full",
                            "data-[selected=true]:bg-primary-600 data-[selected=true]:text-white data-[selected=true]:shadow-md",
                        ].join(" "),
                    }
                }}

                // Styling for the picker - similar to CompactDateRangePicker
                classNames={{
                    base: cn("w-full max-w-lg", className),
                    label: "text-slate-700 font-semibold text-sm",
                    inputWrapper: cn(
                        "bg-white shadow-sm rounded-xl h-12 border-slate-200",
                        "hover:border-slate-300 focus-within:border-primary-500",
                        errorMessage && "border-red-300",
                        color && "pl-3"
                    ),
                    // Hide the default segments
                    segment: "opacity-0",
                    // Time input styling
                    timeInputLabel: "text-slate-600 font-medium text-xs uppercase tracking-wide mb-1",
                    // timeInput: "bg-slate-100 rounded-lg shadow-sm px-3 py-2",
                }}
            />

            {/* Custom display overlay showing dd/mm/yyyy format */}
            {displayValue && (
                <div
                    className="absolute pointer-events-none left-0 right-12 top-[26px] h-12 flex items-center px-3 text-sm text-slate-700 font-mono"
                    aria-hidden="true"
                >
                    {displayValue}
                </div>
            )}
        </div>
    );
}
