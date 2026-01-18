import { useState, useEffect, useRef } from "react";
import { ZonedDateTime, now, getLocalTimeZone } from "@internationalized/date";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./Button";
import { CalendarIcon, Clock } from "lucide-react";
import { RangeCalendarUI } from "./RangeCalendarUI";
import { format } from "date-fns";
import { Input } from "./Input";

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
    maxValue?: ZonedDateTime;
    color?: string;
    isStartDisabled?: boolean;
}

// Compact Time Input Component
function TimeInput({ date, onChange, label, disabled }: { date: Date | null, onChange: (d: Date) => void, label: string, disabled?: boolean }) {
    // Local state for the text input to allow "typing" before valid parsing
    const [text, setText] = useState("");

    useEffect(() => {
        if (date) {
            setText(format(date, "h:mm aa"));
        } else {
            setText("");
        }
    }, [date]);

    const handleBlur = () => {
        if (!date && !text) return;

        // Simple Parse Logic for "HH:mm" or "HH:mm AM/PM"
        // Supporting: "09:30", "9:30", "930", "09:30 PM", "21:30"
        let parsed = new Date(date || new Date());
        let cleanText = text.trim().toLowerCase();
        let isPM = cleanText.includes("pm") || cleanText.includes("p");
        let isAM = cleanText.includes("am") || cleanText.includes("a");

        // Remove alphas
        cleanText = cleanText.replace(/[a-z\s]/g, "");

        // Split
        let hours = 0;
        let minutes = 0;

        if (cleanText.includes(":")) {
            const parts = cleanText.split(":");
            hours = parseInt(parts[0]);
            minutes = parseInt(parts[1]) || 0;
        } else if (cleanText.length >= 3) {
            // 930 -> 9:30, 2130 -> 21:30
            const mid = cleanText.length - 2;
            hours = parseInt(cleanText.substring(0, mid));
            minutes = parseInt(cleanText.substring(mid));
        } else {
            hours = parseInt(cleanText);
        }

        if (isNaN(hours)) {
            // Revert
            if (date) setText(format(date, "h:mm aa"));
            return;
        }

        // Normalize 12h inputs if AM/PM was specified
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        // Clamp
        if (hours > 23) hours = 23;
        if (hours < 0) hours = 0;
        if (minutes > 59) minutes = 59;

        parsed.setHours(hours, minutes, 0, 0);

        // Update parent
        onChange(parsed);
        // Text will update via useEffect
    };

    return (
        <div className={cn("flex flex-col gap-1.5", disabled && "opacity-50 pointer-events-none")}>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pl-0.5">{label}</span>
            <div className="relative">
                <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    placeholder="00:00 AM"
                    className="h-9 w-28 font-mono text-sm bg-slate-50 border-slate-200 focus:border-cyan-500 pr-8"
                    disabled={disabled}
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
        </div>
    );
}

/**
 * Modern Custom Range Date Picker
 * Replaces HeroUI implementation while keeping strict API compatibility.
 */
export function DateRangePickerField({
    label,
    value,
    onChange,
    className,
    errorMessage,
    isRequired,
    minValue,
    maxValue,
    color,
    isStartDisabled
}: DateRangePickerFieldProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Internal state management for the UI (JS Date objects)
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Parsed State
    const [internalStart, setInternalStart] = useState<Date | null>(null);
    const [internalEnd, setInternalEnd] = useState<Date | null>(null);

    // -- LOGIC: PARSING --
    // Convert incoming ISO strings (with Z) to JS Dates for the UI
    // We treat the "Z" as the local time for the purpose of the UI if we want to honor "User's Local Time" or "IST"
    // The previous implementation used `parseZonedDateTime` with `[Asia/Kolkata]`.
    // If the input is `2024...Z`, `new Date()` parses it in local browser time. 
    // To minimize breakage, we will assume standard JS Date parsing is sufficient for the UI interaction,
    // and we will reconstruct the exact format on change.

    useEffect(() => {
        if (value?.start && value?.end) {
            const s = new Date(value.start);
            const e = new Date(value.end);
            setInternalStart(s);
            setInternalEnd(e);
            setCurrentMonth(s); // Focus month on start date
        }
    }, [value]); // Sync when external value changes

    // -- LOGIC: UPDATING --
    // Reconstruct the ISO string + basic formatting
    const fireChange = (newStart: Date, newEnd: Date) => {
        // Validation: Start cannot be after End
        // If selection makes start > end, we might swap them or just effectively set start=end
        let finalStart = newStart;
        let finalEnd = newEnd;

        if (finalStart > finalEnd) {
            // Auto-correct: If user moves start past end, push end to start + 1 hour? 
            // Or just swap? Swapping might be confusing if editing Time.
            // Let's just allow it for a moment or clamp? 
            // Standard behavior: if editing start puts it after end, maybe just let it happen in UI but dont fire?
            // User requested "Complete validation... MUST remain".
            // HeroUI handles this by just swapping or effectively moving the range.
            // Let's just swap for correctness if valid range is required.
            if (isStartDisabled) {
                // If start is disabled, we cannot move it. We must ensure end >= start.
                finalEnd = finalStart;
            } else {
                // Swap
                const temp = finalStart;
                finalStart = finalEnd;
                finalEnd = temp;
            }
        }

        // Format back to ISO string compatible with backend (Local Time)
        // Previous implementation sent "YYYY-MM-DDTHH:mm:ss" without Z/Offset
        // We replicate that to ensure "What you pick is what is saved" (in local time)

        onChange({
            start: format(finalStart, "yyyy-MM-dd'T'HH:mm:ss"),
            end: format(finalEnd, "yyyy-MM-dd'T'HH:mm:ss")
        });
    };

    const handleDateSelect = (date: Date) => {
        // Selection Logic:
        // 1. If start disabled, we only editing End? No, typically disabled start means fixed start date.
        //    But range picker usually implies picking range. 
        //    If `isStartDisabled` is true, clicking a date should probably update END date?
        //    Or if we have both, we need a mode?
        //    Let's assume standard behavior: 
        //    - If no start, set start.
        //    - If start exists but no end, set end.
        //    - If both exist, reset start (unless disabled).

        if (isStartDisabled) {
            // Only update end date
            if (!internalStart) return; // Should not happen if disabled

            // Keep Time of original End, update Date?
            // Or reset Time? "Apple Calendar" usually keeps time if just clicking date.
            const newEnd = new Date(date);
            if (internalEnd) {
                newEnd.setHours(internalEnd.getHours());
                newEnd.setMinutes(internalEnd.getMinutes());
            } else {
                // Default end time?
                newEnd.setHours(23, 59, 0, 0);
            }

            // Ensure newEnd >= internalStart
            if (newEnd < internalStart) {
                return; // Cannot pick date before start
            }

            setInternalEnd(newEnd);
            fireChange(internalStart, newEnd);
            return;
        }

        // Normal Range Selection
        if (!internalStart || (internalStart && internalEnd)) {
            // New Range Start
            const newStart = new Date(date);
            // Default start time: 9 AM
            newStart.setHours(9, 0, 0, 0);

            setInternalStart(newStart);
            setInternalEnd(null); // Clear end
        } else {
            // Completing the range (internalStart exists, no internalEnd)
            const newEnd = new Date(date);
            // Default end time: 5 PM
            newEnd.setHours(17, 0, 0, 0);

            // Check order
            if (newEnd < internalStart) {
                // User clicked earlier date -> make that Start, old Start becomes End? 
                // Or just swap.
                const newStart = newEnd;
                const oldStartAsEnd = new Date(internalStart);
                // Keep the time logic reasonable
                oldStartAsEnd.setHours(17, 0, 0, 0);
                newStart.setHours(9, 0, 0, 0);

                setInternalStart(newStart);
                setInternalEnd(oldStartAsEnd);
                fireChange(newStart, oldStartAsEnd);
            } else {
                setInternalEnd(newEnd);
                fireChange(internalStart, newEnd);
            }
        }
    };

    const handleStartTimeChange = (date: Date) => {
        if (!internalStart) return;
        setInternalStart(date);
        if (internalEnd) fireChange(date, internalEnd);
    };

    const handleEndTimeChange = (date: Date) => {
        if (!internalStart || !internalEnd) return;
        setInternalEnd(date);
        fireChange(internalStart, date);
    };

    // Format for Trigger Display
    const formatDisplay = (d: Date) => format(d, "dd/MM/yyyy, h:mm a");
    const displayValue = internalStart && internalEnd
        ? `${formatDisplay(internalStart)} - ${formatDisplay(internalEnd)}`
        : "Select Date Range";

    // Min/Max for Calendar (Checking disable logic)
    // Convert ZonedDateTime to JS Date for props
    const minDate = minValue ? new Date(minValue.year, minValue.month - 1, minValue.day) : undefined;
    const maxDate = maxValue ? new Date(maxValue.year, maxValue.month - 1, maxValue.day) : undefined;

    return (
        <div className={cn("relative group space-y-2", className)}>
            {label && <label className="text-sm font-semibold text-slate-700">{label}{isRequired && "*"}</label>}

            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "w-full h-10 px-3 text-left bg-white border rounded-lg shadow-sm flex items-center gap-3 transition-all outline-none",
                            "hover:border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100",
                            errorMessage ? "border-red-300" : "border-slate-200",
                            !internalStart && "text-slate-400"
                        )}
                        style={color ? { borderLeft: `3px solid ${color}` } : undefined}
                    >
                        <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-700 truncate flex-1 font-mono">
                            {displayValue}
                        </span>
                        {/* Optional: Add badge or indicator if active? */}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-auto p-0 rounded-xl border-none shadow-2xl overflow-hidden bg-white"
                    align="start"
                    sideOffset={4}
                    onWheel={(e) => e.stopPropagation()} // Prevent Lenis interference
                >
                    <div className="flex flex-col">
                        {/* Calendar Section */}
                        <div className="p-3 bg-white">
                            <RangeCalendarUI
                                currentMonth={currentMonth}
                                onMonthChange={setCurrentMonth}
                                startDate={internalStart}
                                endDate={internalEnd}
                                onDateSelect={handleDateSelect}
                                minValue={minDate}
                                maxValue={maxDate}
                            />
                        </div>

                        {/* Compact Time Row */}
                        {internalStart && (
                            <div className="px-4 pb-4 pt-1 flex items-end justify-between border-t border-slate-50 bg-white">
                                <div className="flex items-center gap-6">
                                    <TimeInput
                                        label="Start"
                                        date={internalStart}
                                        onChange={handleStartTimeChange}
                                        disabled={isStartDisabled}
                                    />
                                    <div className="h-8 w-px bg-slate-100 mt-4 mx-2" />
                                    <TimeInput
                                        label="End"
                                        date={internalEnd}
                                        onChange={handleEndTimeChange}
                                        disabled={!internalEnd}
                                    />
                                </div>
                                <Button size="sm" className="h-9 px-6 bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {errorMessage && (
                <p className="text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{errorMessage}</p>
            )}
        </div>
    );
}

// Re-export for backward compatibility
export { DateRangePickerField as CompactDateRangePicker };
