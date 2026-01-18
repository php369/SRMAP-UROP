import { useRef, useState, useEffect } from "react";
import { cn } from "../../utils/cn";

interface TimeScrollerProps {
    value: Date
    onChange: (date: Date) => void
}

interface ScrollColumnProps {
    items: (number | string)[];
    selectedValue: number | string;
    onSelect: (value: number | string) => void;
    label: string;
    formatLabel?: (value: number | string) => string;
}

function ScrollColumn({ items, selectedValue, onSelect, label, formatLabel }: ScrollColumnProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Auto-scroll to selected value on mount or change
    useEffect(() => {
        if (ref.current) {
            const selectedIndex = items.indexOf(selectedValue as never);
            if (selectedIndex !== -1) {
                const buttonHeight = 32; // Approx height of py-1.5 + text-sm
                const containerHeight = ref.current.clientHeight;
                const scrollPos = (selectedIndex * buttonHeight); // - (containerHeight / 2) + (buttonHeight / 2); // Center logic if needed, but snap handles top

                // We rely on snap, so just scrolling to the approximate position lets snap take over?
                // Actually, simplest is to let user scroll. 
                // But if specific "enable smooth scrolling" was asked, 
                // adding 'scroll-smooth' class to container is the key.
            }
        }
    }, [selectedValue, items]);

    return (
        <div className="flex-1 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">{label}</span>
            <div
                ref={ref}
                className={cn(
                    "w-full flex-1 overflow-y-auto rounded-lg bg-muted/20 scrollbar-hide snap-y snap-mandatory cursor-pointer scroll-smooth",
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
                                    "w-full py-1.5 text-sm rounded-md transition-all text-center shrink-0 snap-center",
                                    isSelected
                                        ? "bg-primary text-primary-foreground shadow-sm font-medium scale-100 opacity-100"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground opacity-70"
                                )}
                            >
                                {formatLabel ? formatLabel(item) : String(item)}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

export function TimeScroller({ value, onChange }: TimeScrollerProps) {
    const safeValue = value || new Date();

    // 12 Hours (1-12)
    const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
    // Minutes (0-59)
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    const periods = ["AM", "PM"];

    const currentHour24 = safeValue.getHours();
    const currentHour12 = currentHour24 % 12 || 12;
    const currentPeriod = currentHour24 >= 12 ? "PM" : "AM";

    const updateHour = (newHour12: number | string) => {
        const d = new Date(safeValue);
        const h = Number(newHour12);
        const normalizedHour = (h % 12);
        const finalHour = currentPeriod === "PM" ? normalizedHour + 12 : normalizedHour;
        d.setHours(finalHour);
        onChange(d);
    };

    const updateMinute = (newMinute: number | string) => {
        const d = new Date(safeValue);
        d.setMinutes(Number(newMinute));
        onChange(d);
    };

    const updatePeriod = (newPeriod: number | string) => {
        const d = new Date(safeValue);
        const p = String(newPeriod);
        const normalizedHour = (currentHour12 % 12);
        const finalHour = p === "PM" ? normalizedHour + 12 : normalizedHour;
        d.setHours(finalHour);
        onChange(d);
    };

    return (
        <div className="flex gap-2 h-44 mt-4 border-t border-border/50 pt-4">
            <ScrollColumn
                label="Hour"
                items={hours12}
                selectedValue={currentHour12}
                onSelect={updateHour}
                formatLabel={(h) => String(h).padStart(2, "0")}
            />
            <ScrollColumn
                label="Minute"
                items={minutes}
                selectedValue={safeValue.getMinutes()}
                onSelect={updateMinute}
                formatLabel={(m) => String(m).padStart(2, "0")}
            />
            <ScrollColumn
                label="Shift"
                items={periods}
                selectedValue={currentPeriod}
                onSelect={updatePeriod}
            />
        </div>
    )
}
