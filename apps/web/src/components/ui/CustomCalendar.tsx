"use client"

import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    isSameMonth,
    isSameDay,
    format,
} from "date-fns"

interface CalendarProps {
    value: Date
    onChange: (date: Date) => void
}

export function CustomCalendar({ value, onChange }: CalendarProps) {
    // Fallback if value is undefined (though prop says Date)
    const safeValue = value || new Date();

    const monthStart = startOfMonth(safeValue)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = []
    let day = startDate

    while (day <= endDate) {
        days.push(day)
        day = addDays(day, 1)
    }

    // Disable dates before today (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="w-full">
            {/* Month Header */}
            <div className="mb-4 text-sm font-medium text-center">
                {format(safeValue, "MMMM yyyy")}
            </div>

            {/* Week labels */}
            <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                    <div key={d} className="text-center">{d}</div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
                {days.map(d => {
                    const isPast = d < today;
                    return (
                        <button
                            key={d.toISOString()}
                            disabled={isPast}
                            onClick={() =>
                                onChange(
                                    new Date(
                                        d.getFullYear(),
                                        d.getMonth(),
                                        d.getDate(),
                                        safeValue.getHours(),
                                        safeValue.getMinutes()
                                    )
                                )
                            }
                            type="button"
                            className={[
                                "h-8 w-8 rounded-lg text-sm transition flex items-center justify-center mx-auto",
                                isSameMonth(d, safeValue)
                                    ? "text-foreground"
                                    : "text-muted-foreground/40",
                                isSameDay(d, safeValue)
                                    ? "bg-primary text-primary-foreground"
                                    : isPast
                                        ? "opacity-30 cursor-not-allowed"
                                        : "hover:bg-muted",
                            ].join(" ")}
                        >
                            {format(d, "d")}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
