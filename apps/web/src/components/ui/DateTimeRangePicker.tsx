import { DateRangePicker as HerouiDateRangePicker } from "@heroui/date-picker";
import { parseZonedDateTime, DateValue, ZonedDateTime } from "@internationalized/date";
import { cn } from "../../lib/utils";

interface DateTimeRangePickerProps {
    label?: string;
    value?: {
        start: string;
        end: string;
    };
    onChange: (value: { start: string; end: string }) => void;
    className?: string;
    errorMessage?: string;
    isRequired?: boolean;
}

export function DateTimeRangePicker({
    label,
    value,
    onChange,
    className,
    errorMessage,
    isRequired
}: DateTimeRangePickerProps) {

    // Convert ISO strings to ZonedDateTime
    const getPickerValue = () => {
        try {
            if (value?.start && value?.end) {
                // Ensure consistent format and timezone handling (IST or local)
                // This simple regex strip handles most basic ISO formats for parsing
                const startStr = value.start.replace('Z', '').replace(/\+.*$/, '');
                const endStr = value.end.replace('Z', '').replace(/\+.*$/, '');

                return {
                    start: parseZonedDateTime(`${startStr}[Asia/Kolkata]`),
                    end: parseZonedDateTime(`${endStr}[Asia/Kolkata]`)
                };
            }
        } catch (e) {
            console.warn("Date parsing error:", e);
        }
        return null;
    };

    const handleRunChange = (val: { start: ZonedDateTime; end: ZonedDateTime } | null) => {
        if (!val) {
            // Handle clear logic if needed, or just do nothing
            return;
        }

        const { start, end } = val;

        // Helper to format consistent string output
        const format = (date: ZonedDateTime) => {
            const year = date.year;
            const month = String(date.month).padStart(2, '0');
            const day = String(date.day).padStart(2, '0');
            const hour = String(date.hour).padStart(2, '0');
            const minute = String(date.minute).padStart(2, '0');

            // Return ISO-like string
            return `${year}-${month}-${day}T${hour}:${minute}:00`;
        };

        onChange({
            start: format(start),
            end: format(end)
        });
    };

    return (
        <div className={cn("w-full", className)}>
            <HerouiDateRangePicker
                label={label}
                value={getPickerValue()}
                onChange={handleRunChange}
                errorMessage={errorMessage}
                isInvalid={!!errorMessage}
                isRequired={isRequired}
                hideTimeZone
                granularity="minute"
                variant="bordered"
                visibleMonths={1}
                className="max-w-full"
                // Ensure the picker matches our unified shadcn-like aesthetic
                classNames={{
                    base: "bg-white",
                    inputWrapper: "border-input bg-transparent hover:bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:border-ring shadow-sm",
                    label: "text-foreground font-medium",
                }}
            />
        </div>
    );
}
