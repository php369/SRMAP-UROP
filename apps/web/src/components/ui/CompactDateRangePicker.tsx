import { DateRangePicker } from "@heroui/date-picker";
import { parseZonedDateTime, ZonedDateTime, now, getLocalTimeZone } from "@internationalized/date";
import { cn } from "../../lib/utils";


interface DateRangePickerFieldProps {
    label: string;
    value?: {
        start: string;
        end: string;
    } | null;
    onChange: (value: { start: string; end: string }) => void;
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
 * A styled DateRangePicker using HeroUI with:
 * - Custom dd/mm/yyyy display format
 * - Two visible months side-by-side
 * - Time fields at the bottom
 * - Darker blue for start/end dates
 */
export function DateRangePickerField({
    label,
    value,
    onChange,
    className,
    errorMessage,
    isRequired,
    minValue,
    color
}: DateRangePickerFieldProps) {

    // Convert ISO strings to ZonedDateTime for the picker
    const getPickerValue = (): { start: ZonedDateTime; end: ZonedDateTime } | null => {
        try {
            if (value?.start && value?.end) {
                const startStr = value.start.replace('Z', '').replace(/\+.*$/, '');
                const endStr = value.end.replace('Z', '').replace(/\+.*$/, '');

                return {
                    start: parseZonedDateTime(`${startStr}[Asia/Kolkata]`),
                    end: parseZonedDateTime(`${endStr}[Asia/Kolkata]`)
                };
            }
        } catch (e) {
            console.warn("DateRangePickerField: parse error", e);
        }
        return null;
    };

    // Convert ZonedDateTime back to ISO string format
    const handleChange = (val: { start: ZonedDateTime; end: ZonedDateTime } | null) => {
        if (!val) return;
        const { start, end } = val;

        const format = (date: ZonedDateTime) => {
            const year = date.year;
            const month = String(date.month).padStart(2, '0');
            const day = String(date.day).padStart(2, '0');
            const hour = String(date.hour).padStart(2, '0');
            const minute = String(date.minute).padStart(2, '0');
            const second = String(date.second).padStart(2, '0');
            return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        };

        onChange({
            start: format(start),
            end: format(end)
        });
    };

    // Default min value is NOW if not provided
    const effectiveMinValue = minValue || now(getLocalTimeZone());

    // Custom formatted display string (dd/mm/yyyy)
    const displayValue = value?.start && value?.end
        ? `${formatDateDisplay(value.start)} - ${formatDateDisplay(value.end)}`
        : '';

    // Dynamic style for the input wrapper based on color prop
    // We use a style object for the specific border color when focused or hovered if provided
    const wrapperStyle = color ? {
        '--custom-border': color,
        borderColor: value?.start ? color : undefined // Show color if valid value exists? Or maybe just on focus?
        // Let's stick to standard HeroUI variants but maybe use style for specific overrides if feasible.
        // HeroUI doesn't easily accept arbitrary colors for focus ring via classNames without Tailwind config.
        // Instead, let's use a wrapper div with a border if color is provided?
        // Actually, let's just use the `color` to style the left border to indicate phase.
    } as React.CSSProperties : {};

    return (
        <div className="relative group">
            {/* Color Indicator Line */}
            {color && (
                <div
                    className="absolute left-0 top-8 bottom-0 w-1 rounded-l-xl z-20 pointer-events-none transition-opacity"
                    style={{ backgroundColor: color, opacity: value?.start ? 1 : 0.3 }}
                />
            )}

            <DateRangePicker
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
                visibleMonths={2}
                pageBehavior="single"

                // Appearance
                variant="bordered"
                labelPlacement="outside"

                // Calendar styling for range highlighting
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
                        // Cell styling for range selection
                        cell: [
                            "data-[selected=true]:data-[range-selection=true]:before:bg-primary-100",
                            "data-[selection-start=true]:rounded-l-full",
                            "data-[selection-end=true]:rounded-r-full",
                        ].join(" "),
                        cellButton: [
                            // Hover state
                            "hover:bg-slate-100",
                            // Default selected state
                            "data-[selected=true]:bg-primary-500 data-[selected=true]:text-white",
                            // Override for range middle cells: light background, dark text
                            "data-[selected=true]:data-[range-selection=true]:bg-primary-100 data-[selected=true]:data-[range-selection=true]:text-primary-700",
                            // Start cell: DARKER blue (blue-600)
                            "data-[selection-start=true]:bg-blue-600 data-[selection-start=true]:text-white",
                            "data-[selection-start=true]:rounded-full",
                            // End cell: DARKER blue (blue-600)
                            "data-[selection-end=true]:bg-blue-600 data-[selection-end=true]:text-white",
                            "data-[selection-end=true]:rounded-full",
                        ].join(" "),
                    }
                }}

                // Styling for the picker - hide segments with opacity
                classNames={{
                    base: cn("w-full max-w-lg", className),
                    label: "text-slate-700 font-semibold text-sm",
                    inputWrapper: cn(
                        "bg-white shadow-sm rounded-xl h-12 border-slate-200",
                        "hover:border-slate-300 focus-within:border-primary-500",
                        errorMessage && "border-red-300",
                        // Make room for the colored line
                        color && "pl-3"
                    ),
                    // Hide the default segments (we'll overlay our custom format)
                    segment: "opacity-0",
                    separator: "opacity-0",
                    // Make time inputs side-by-side using flex
                    bottomContent: "flex flex-row gap-4 px-4 pb-4 pt-2",
                    timeInputWrapper: "flex-1",
                    timeInputLabel: "text-slate-600 font-medium text-xs uppercase tracking-wide mb-1",
                    timeInput: "bg-slate-100 rounded-lg shadow-sm px-3 py-2",
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

// Re-export for backward compatibility
export { DateRangePickerField as CompactDateRangePicker };
