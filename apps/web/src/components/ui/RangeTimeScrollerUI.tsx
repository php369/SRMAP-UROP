import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RangeTimeScrollerUIProps {
    startTime: Date;
    endTime: Date;
    onStartTimeChange: (date: Date) => void;
    onEndTimeChange: (date: Date) => void;
}

interface ScrollColumnProps {
    items: number[];
    selectedValue: number;
    onSelect: (value: number) => void;
    label: string;
    formatLabel?: (value: number) => string;
}

function ScrollColumn({ items, selectedValue, onSelect, label, formatLabel }: ScrollColumnProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            const selectedIndex = items.indexOf(selectedValue);
            if (selectedIndex !== -1) {
                const buttonHeight = 32;
                const containerHeight = ref.current.clientHeight;
                // Optional: could implement auto-scroll to center on mount
            }
        }
    }, [selectedValue, items]);

    return (
        <div className="flex-1 flex flex-col items-center gap-2">
            <div
                ref={ref}
                className={cn(
                    "w-full h-32 overflow-y-auto rounded-md bg-transparent scrollbar-hide snap-y snap-mandatory cursor-pointer scroll-smooth",
                    "select-none overscroll-contain touch-pan-y"
                )}
                data-lenis-prevent="true"
            >
                <div className="flex flex-col p-1 gap-1 py-[calc(50%-16px)]">
                    {items.map((item) => {
                        const isSelected = selectedValue === item;
                        return (
                            <button
                                key={item}
                                onClick={() => onSelect(item)}
                                type="button"
                                className={cn(
                                    "w-full h-8 flex items-center justify-center text-sm rounded-md transition-all shrink-0 snap-center",
                                    isSelected
                                        ? "bg-primary/10 text-primary font-bold scale-110"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                {formatLabel ? formatLabel(item) : String(item).padStart(2, '0')}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

function TimePickerSection({
    date,
    onChange,
    label
}: {
    date: Date,
    onChange: (d: Date) => void,
    label: string
}) {
    // 12 Hours (1-12) / 24 Hours
    // User requested "Scrollable time columns (hours + minutes)"
    // The previous picker was 12h. Let's stick to 12h for "Modern" feel.

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = [0, 15, 30, 45]; // Snap to 15-minute intervals
    const periods = ["AM", "PM"]; // We handle AM/PM as 0/1 for index or string

    const currentHour24 = date.getHours();
    const currentHour12 = currentHour24 % 12 || 12;
    const currentMinute = date.getMinutes();
    const currentPeriodIndex = currentHour24 >= 12 ? 1 : 0; // 0=AM, 1=PM

    const updateTime = (h12: number, m: number, pIndex: number) => {
        const newDate = new Date(date);
        const p = pIndex === 0 ? "AM" : "PM";
        let h24 = h12;

        if (p === "AM" && h12 === 12) h24 = 0;
        if (p === "PM" && h12 !== 12) h24 = h12 + 12;

        newDate.setHours(h24);
        newDate.setMinutes(m);
        onChange(newDate);
    };

    return (
        <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
                {/* Hours */}
                <ScrollColumn
                    label="Hr"
                    items={hours}
                    selectedValue={currentHour12}
                    onSelect={(h) => updateTime(h, currentMinute, currentPeriodIndex)}
                />

                <span className="text-slate-300 font-light text-xl h-8 flex items-center pb-1">:</span>

                {/* Minutes */}
                <ScrollColumn
                    label="Min"
                    items={minutes}
                    selectedValue={currentMinute}
                    onSelect={(m) => updateTime(currentHour12, m, currentPeriodIndex)}
                    formatLabel={(m) => String(m).padStart(2, '0')}
                />

                {/* AM/PM */}
                <div className="flex flex-col gap-1 ml-1">
                    <button
                        type="button"
                        onClick={() => updateTime(currentHour12, currentMinute, 0)}
                        className={cn(
                            "text-[10px] font-bold px-1.5 py-1 rounded transition-colors",
                            currentPeriodIndex === 0 ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={() => updateTime(currentHour12, currentMinute, 1)}
                        className={cn(
                            "text-[10px] font-bold px-1.5 py-1 rounded transition-colors",
                            currentPeriodIndex === 1 ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                        )}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>
    )
}

export function RangeTimeScrollerUI({ startTime, endTime, onStartTimeChange, onEndTimeChange }: RangeTimeScrollerUIProps) {
    return (
        <div className="flex items-center justify-around w-full gap-4 pt-4 border-t border-slate-100 mt-2">
            <TimePickerSection
                label="Start Time"
                date={startTime}
                onChange={onStartTimeChange}
            />
            <div className="h-20 w-px bg-slate-200" /> {/* Divider */}
            <TimePickerSection
                label="End Time"
                date={endTime}
                onChange={onEndTimeChange}
            />
        </div>
    );
}
